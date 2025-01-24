import { z } from 'zod'
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { env } from 'hono/adapter'
import { createMiddleware } from 'hono/factory'
const schema = z.object({
    username: z.string(),
    password: z.string().min(6),
  })

export const signinMIddleware = createMiddleware(async(c,next)=>{
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
                    username:body.username,
                    password:body.password
                },
                select:{
                    id:true,
                    name:true,
                    username:true,
                    todo:true,
                    created_at:true,
                    notifications:true,
                    projects:{
                        select:{
                            id:true,
                            user_id:true,
                            title:true,
                            folder_id:true,
                            link:true,
                            archive:true,
                            done:true,
                            created_at:true,
                            workmails:true,
                            subworkmails:true
                        }
                    },
                    workhistory:true,
                    weeklytask:true,
                    calenderevents:true,
                }
            })
            if(ress){
                c.set("alluserinfo",ress);
                await next();
            }

        }catch(err){
            prisma.$disconnect();
            return c.json({
                message: "server error"
            })
        }finally{
            prisma.$disconnect();
        }
        return c.json({
            message:"no user found"
        })
    }
})