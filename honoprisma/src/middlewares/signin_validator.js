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
exports.signinMIddleware = void 0;
const zod_1 = require("zod");
const edge_1 = require("@prisma/client/edge");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
const adapter_1 = require("hono/adapter");
const factory_1 = require("hono/factory");
const schema = zod_1.z.object({
    username: zod_1.z.string(),
    password: zod_1.z.string().min(6),
});
exports.signinMIddleware = (0, factory_1.createMiddleware)((c, next) => __awaiter(void 0, void 0, void 0, function* () {
    const body = yield c.req.json();
    const resp = schema.safeParse(body);
    if (!resp.success) {
        c.status(401);
        return c.json({
            message: "give proper input"
        });
    }
    else {
        const { DATABASE_URL } = (0, adapter_1.env)(c);
        const prisma = new edge_1.PrismaClient({
            datasourceUrl: DATABASE_URL,
        }).$extends((0, extension_accelerate_1.withAccelerate)());
        try {
            const ress = yield prisma.user.findFirst({
                where: {
                    username: body.username
                },
                select: {
                    name: true,
                    username: true
                }
            });
            if (ress) {
                yield next();
            }
        }
        catch (err) {
            prisma.$disconnect();
            return c.json({
                message: "server error"
            });
        }
        finally {
            prisma.$disconnect();
        }
        return c.json({
            message: "no user found"
        });
    }
}));
