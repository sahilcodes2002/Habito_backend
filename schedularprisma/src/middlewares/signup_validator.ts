import { z } from 'zod'
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { env } from 'hono/adapter'
import { createMiddleware } from 'hono/factory'
const schema = z.object({
    name: z.string(),
    username: z.string(),
    password: z.string().min(6),
  })

export const signupMIddleware = createMiddleware(async(c,next)=>{
    const body = await c.req.json();
    const resp = schema.safeParse(body);
    if(!resp.success){
        c.status(401);
        return c.json({
            message:"give proper input"
        })
    }else{
        const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
        const prisma = new PrismaClient({
            datasourceUrl: DATABASE_URL,
        }).$extends(withAccelerate());
        try{
            const ress = await prisma.user.findFirst({
                where:{
                    username:body.username
                },
                select:{
                    id:true
                }
            })
            if(ress){
                return c.json({
                    message:"username already exists"
                })
            }

        }catch(err){
            prisma.$disconnect();
            return c.json({
                message: "server error"
            })
        }finally{
            prisma.$disconnect();
        }
        
        await next();
    }
})