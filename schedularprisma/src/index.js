"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const edge_1 = require("@prisma/client/edge");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
const adapter_1 = require("hono/adapter");
const signup_validator_1 = require("./middlewares/signup_validator");
const signin_validator_1 = require("./middlewares/signin_validator");
const jwt_1 = require("hono/jwt");
const app = new hono_1.Hono();
function jwtsign(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = {
            username: username
        };
        const secret = 'mySecretKey';
        const token = yield (0, jwt_1.sign)(payload, secret);
        return token;
    });
}
app.get('/signup', signup_validator_1.signupMIddleware, (c) => __awaiter(void 0, void 0, void 0, function* () {
    const b = yield c.req.json();
    const { DATABASE_URL } = (0, adapter_1.env)(c);
    const prisma = new edge_1.PrismaClient({
        datasourceUrl: DATABASE_URL,
    }).$extends((0, extension_accelerate_1.withAccelerate)());
    try {
        const res = yield prisma.user.create({
            data: {
                name: b.name,
                username: b.username,
                password: b.password
            },
            select: {
                name: true,
                username: true
            }
        });
        const token = yield jwtsign(b.username);
        return c.json({
            res: res,
            token: token
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        return c.text('Internal Server Error', 500);
    }
    finally {
        prisma.$disconnect();
    }
}));
app.post('/signin', signin_validator_1.signinMIddleware, (c) => __awaiter(void 0, void 0, void 0, function* () {
    const b = yield c.req.json();
    const token = yield jwtsign(b.username);
    const { DATABASE_URL } = (0, adapter_1.env)(c);
    const prisma = new edge_1.PrismaClient({
        datasourceUrl: DATABASE_URL,
    }).$extends((0, extension_accelerate_1.withAccelerate)());
    var r = null;
    try {
        r = yield prisma.user.findMany({
            where: {
                username: b.username
            },
            include: {
                todo: true
            }
        });
    }
    catch (err) {
        return c.json({
            message: "database error"
        });
    }
    finally {
        prisma.$disconnect();
    }
    return c.json({
        token: token,
        data: r
    });
}));
// Export the Hono app
exports.default = app;
