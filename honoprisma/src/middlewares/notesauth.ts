import { z } from 'zod'
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { env } from 'hono/adapter'
import { createMiddleware } from 'hono/factory'
import { decode, sign, verify } from 'hono/jwt'
const schema = z.object({
    username: z.string(),
    password: z.string().min(6),
  })

export const notesauth = createMiddleware(async(c,next)=>{
    
    const h = c.req.header("Authorization");
    const words = h?.split(" ");
    if(words && words.length>1){
        const tokenr = words[1];
        const secret = 'mySecretKey'
        const body = await verify(tokenr,secret);
        if(!body.username){
            return c.json({
                message: "auth failed"
            })
        }
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
                    id:true,
                    name:true,
                    username:true,
                    folder:true,
                    notes:true
                }
            })
            if(ress){
                c.set("userinfo",ress);
                await next();
            }
            return c.json({
                message:"auth failed"
            })

        }catch(err){
            prisma.$disconnect();
            return c.json({
                message: "server error"
            })
        }finally{
            prisma.$disconnect();
        }
    }else{
        return c.json({
        message:"authorization failed"
        })
    }
        
})