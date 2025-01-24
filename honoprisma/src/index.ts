import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { endOfToday } from 'date-fns';
import { subDays } from 'date-fns';
import {env} from 'hono/adapter'
import { signupMIddleware } from './middlewares/signup_validator';
import { signinMIddleware } from './middlewares/signin_validator';
import { authtoken } from './middlewares/authorizetoken';
import { decode, sign, verify } from 'hono/jwt'
import { cors } from 'hono/cors';
import z from 'zod'
//import { FetchEvent, Response, ScheduledEvent } from '@cloudflare/workers-types';

//import { notesauth } from './middlewares/notesauth';


const app = new Hono();
app.use(cors());

async function jwtsign(username:string):Promise<string>{
  const payload = {
    username:username
  }
  const secret = 'mySecretKey'
  const token = await sign(payload, secret)
  return token;
}




// app.get('/test-schedule', async(c) => {
//   await handleScheduled({} as ScheduledEvent); // Mock the ScheduledEvent
//   return c.text('Scheduled task executed');
// });

// addEventListener('fetch', (event: FetchEvent) => {
//   // @ts-ignore
//   event.respondWith(app.fetch(event.request));
// });

// addEventListener('scheduled', (event: ScheduledEvent) => {
//   event.waitUntil(handleScheduled(event));
// });


app.post('/remidedtasks', authtoken,async (c:any) => {

  const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  async function getall() {
    try {
      // Fetch the data
      const tasks = await prisma.project.findMany(
        {
          where:{
            user_id:userId,
          },
          select:{
            workmails:true,
            subworkmails:true
          }
        }
      );
      const mailworks = await prisma.mailworks.findMany();
      const mailsubworks = await prisma.mailsubworks.findMany();
      
      // Create a map to group data by email
      const emailMap = new Map<string, { title: string; description?: string; project_id: number }[]>();
  
      // Helper function to add data to the map
      function addToMap(email: string, title: string,project_id:number, description?: string) {
        if (!emailMap.has(email)) {
          emailMap.set(email, []);
        }
        emailMap.get(email)?.push({ title, description, project_id });
      }
  
      // Process mailworks
      mailworks.forEach(mailwork => {
        addToMap(mailwork.email, mailwork.title, mailwork.project_id ,mailwork.description || "");
      });
  
      // Process mailsubworks
      mailsubworks.forEach(mailsubwork => {
        addToMap(mailsubwork.email, mailsubwork.title,mailsubwork.project_id ,mailsubwork.description || "");
      });
  
      // Convert map to array format
      const result = Array.from(emailMap.entries()).map(([email, items]) => ({
        email,
        items
      }));
  
      console.log('Result from /tosendworks:', result);
  
      // Return the result
      return {
        result,
        success: true
      };
  
    } catch (error) {
      console.error('Error processing request:', error);
      return { error: 'Internal Server Error', success: false };
    } finally {
      await prisma.$disconnect();
    }
  }

  try {
    const resp = await getall();
    const response2 = await fetch('https://mailexpress.vercel.app/sendmail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resp), // Send data1 as JSON body
          });
    console.log(resp);
    return c.json(resp);
  } catch (error) {
    console.error('Error in getall function:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

app.post('/tosendworks', async (c) => {
  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  async function getall() {
    try {
      // Fetch the data
      const mailworks = await prisma.mailworks.findMany();
      const mailsubworks = await prisma.mailsubworks.findMany();
      
      // Create a map to group data by email
      const emailMap = new Map<string, { title: string; description?: string; project_id: number }[]>();
  
      // Helper function to add data to the map
      function addToMap(email: string, title: string,project_id:number, description?: string) {
        if (!emailMap.has(email)) {
          emailMap.set(email, []);
        }
        emailMap.get(email)?.push({ title, description, project_id });
      }
  
      // Process mailworks
      mailworks.forEach(mailwork => {
        addToMap(mailwork.email, mailwork.title, mailwork.project_id ,mailwork.description || "");
      });
  
      // Process mailsubworks
      mailsubworks.forEach(mailsubwork => {
        addToMap(mailsubwork.email, mailsubwork.title,mailsubwork.project_id ,mailsubwork.description || "");
      });
  
      // Convert map to array format
      const result = Array.from(emailMap.entries()).map(([email, items]) => ({
        email,
        items
      }));
  
      console.log('Result from /tosendworks:', result);
  
      // Return the result
      return {
        result,
        success: true
      };
  
    } catch (error) {
      console.error('Error processing request:', error);
      return { error: 'Internal Server Error', success: false };
    } finally {
      await prisma.$disconnect();
    }
  }

  try {
    const resp = await getall();
    const response2 = await fetch('https://mailexpress.vercel.app/sendmail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resp), // Send data1 as JSON body
          });
    console.log(resp);
    return c.json(resp);
  } catch (error) {
    console.error('Error in getall function:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});






app.post('/varification', async (c) => {
  const body = await c.req.json();
  console.log(body);
  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  const emailSchema = z.object({
    email: z.string().email(),
  });

  function generateVerificationCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  try {
    const validation = emailSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'Invalid email format',success:false }, 400);
    }
    const code = generateVerificationCode();
    const email = body.email.trim();
    //const trimmedStr = str.trim();
    const resp = {
      email,
      code
    }
    
    const response2 = await fetch('https://mailexpress.vercel.app/sendcode', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resp), // Send data1 as JSON body
          });
    const result = await response2.json();
    try {
      const res = await prisma.emailwithcode.upsert({
        where: { email: email }, // Check if email already exists
        update: { code: code }, // If exists, update the code
        create: { email: email, code: code }, // If doesn't exist, create a new record
        select: { id: true },
      });
      
      return c.json({
        res: res,
        success:true
      });
    } catch (error) {
      console.error('Error creating/updating record:', error);
      return c.json({message:'Internal Server Error',success:true}, 500);
    } finally {
      prisma.$disconnect();
    }
    //console.log(result);

  } catch (error) {
    console.error('Error in verifying', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});




app.post('/varifycode', async (c) => {
  const body = await c.req.json();
  console.log(body);
  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const code = body.code;
    const email = body.email.trim();
    try {
      const res = await prisma.emailwithcode.findUnique({
        where: { email: email }, // Check if email already exists
        select: { id: true, code:true},
      });

      if(res && res.code===code){
        return c.json({
          success:true
        });
      }else{
        return c.json({
          success:false
        });
      }
      
      
    } catch (error) {
      console.error('Error creating/updating record:', error);
      return c.json({message:'Internal Server Error',success:false}, 500);
    } finally {
      prisma.$disconnect();
    }
    //console.log(result);

  } catch (error) {
    console.error('Error in verifying', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});









// async function handleScheduled(event: ScheduledEvent) {

//   const DATABASE_URL = "prisma://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiNGFhYWFiNDctNjE3Yy00ZjMxLWExMzktM2NmMmVmMTMzNDY1IiwidGVuYW50X2lkIjoiZjJkNzY5N2E2NGZlNjI5OGQ4ZmU3NTVhYmRmZDkyYTNmNzk3MDFhZGY4MjQzMjM0NGVjY2QxMzM5YWU0NWY0MSIsImludGVybmFsX3NlY3JldCI6IjM0OWFjMjhhLWVlYWQtNDI5NS1iMTA5LTI1ZTgyYjJhMGYzZSJ9.4zCaFPGnGY-AZjQDIZDyMLcwOzaqwYYF-yTjPTgV9yc";

//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   async function getall() {
//     try {
//       // Fetch the data
//       const mailworks = await prisma.mailworks.findMany();
//       const mailsubworks = await prisma.mailsubworks.findMany();
      
//       // Create a map to group data by email
//       const emailMap = new Map<string, { title: string; description?: string; project_id: number }[]>();
  
//       // Helper function to add data to the map
//       function addToMap(email: string, title: string,project_id:number, description?: string) {
//         if (!emailMap.has(email)) {
//           emailMap.set(email, []);
//         }
//         emailMap.get(email)?.push({ title, description, project_id });
//       }
  
//       // Process mailworks
//       mailworks.forEach(mailwork => {
//         addToMap(mailwork.email, mailwork.title, mailwork.project_id ,mailwork.description || "");
//       });
  
//       // Process mailsubworks
//       mailsubworks.forEach(mailsubwork => {
//         addToMap(mailsubwork.email, mailsubwork.title,mailsubwork.project_id ,mailsubwork.description || "");
//       });
  
//       // Convert map to array format
//       const result = Array.from(emailMap.entries()).map(([email, items]) => ({
//         email,
//         items
//       }));
  
//       console.log('Result from /tosendworks:', result);
  
//       // Return the result
//       return {
//         result,
//         success: true
//       };
  
//     } catch (error) {
//       console.error('Error processing request:', error);
//       return { error: 'Internal Server Error', success: false };
//     } finally {
//       await prisma.$disconnect();
//     }
//   }

//   try {
//     const resp = await getall();
//     const response2 = await fetch('https://mailexpress.vercel.app/sendmail', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(resp), // Send data1 as JSON body
//           });
//     console.log(resp);
//     //return c.json(resp);
//   } catch (error) {
//     console.error('Error in getall function:', error);
//     //return c.json({ error: 'Internal Server Error' }, 500);
//   }


// }


async function handleScheduled() {

  const DATABASE_URL = "prisma://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiNGFhYWFiNDctNjE3Yy00ZjMxLWExMzktM2NmMmVmMTMzNDY1IiwidGVuYW50X2lkIjoiZjJkNzY5N2E2NGZlNjI5OGQ4ZmU3NTVhYmRmZDkyYTNmNzk3MDFhZGY4MjQzMjM0NGVjY2QxMzM5YWU0NWY0MSIsImludGVybmFsX3NlY3JldCI6IjM0OWFjMjhhLWVlYWQtNDI5NS1iMTA5LTI1ZTgyYjJhMGYzZSJ9.4zCaFPGnGY-AZjQDIZDyMLcwOzaqwYYF-yTjPTgV9yc";

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  async function getall() {
    try {
      // Fetch the data
      const mailworks = await prisma.mailworks.findMany();
      const mailsubworks = await prisma.mailsubworks.findMany();
      
      // Create a map to group data by email
      const emailMap = new Map<string, { title: string; description?: string; project_id: number }[]>();
  
      // Helper function to add data to the map
      function addToMap(email: string, title: string,project_id:number, description?: string) {
        if (!emailMap.has(email)) {
          emailMap.set(email, []);
        }
        emailMap.get(email)?.push({ title, description, project_id });
      }
  
      // Process mailworks
      mailworks.forEach(mailwork => {
        addToMap(mailwork.email, mailwork.title, mailwork.project_id ,mailwork.description || "");
      });
  
      // Process mailsubworks
      mailsubworks.forEach(mailsubwork => {
        addToMap(mailsubwork.email, mailsubwork.title,mailsubwork.project_id ,mailsubwork.description || "");
      });
  
      // Convert map to array format
      const result = Array.from(emailMap.entries()).map(([email, items]) => ({
        email,
        items
      }));
  
      console.log('Result from /tosendworks:', result);
  
      // Return the result
      return {
        result,
        success: true
      };
  
    } catch (error) {
      console.error('Error processing request:', error);
      return { error: 'Internal Server Error', success: false };
    } finally {
      await prisma.$disconnect();
    }
  }

  try {
    const resp = await getall();
    const response2 = await fetch('https://mailexpress.vercel.app/sendmail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resp), // Send data1 as JSON body
          });
    console.log(resp);
    //return c.json(resp);
  } catch (error) {
    console.error('Error in getall function:', error);
    //return c.json({ error: 'Internal Server Error' }, 500);
  }





  // try {
  //   // const response1 = await fetch('https://honoprisma.codessahil.workers.dev/tosendworks', {
  //   //   method: 'POST',
  //   // });
  //   const response1 = await fetch('https://honoprisma.codessahil.workers.dev/varification', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json', // Ensure the server knows you're sending JSON data
  //     },
  //     body: JSON.stringify({
  //       email: 'sahil090202@gmail.com',
  //       code: '9823',
  //     }),
  //   });

  //   // if (!response1.ok) {
  //   //   throw new Error(`Failed to fetch data from first endpoint: ${response1.statusText}`);
  //   // }  9717

  //   console.log('Response status from /tosendworks:', response1.status);
  //   const data1 = await response1.json();
  //   console.log('Data from /tosendworks:', data1);

  // } catch (err) {
  //   console.error('Error:', err);
  // }
}


// async function handleScheduled(event: ScheduledEvent) {
//   try {
//     const response1 = await fetch('http://127.0.0.1:8787/tosendworks', {
//       method: 'POST',
//     });

//     // if (!response1.ok) {
//     //   throw new Error(`Failed to fetch data from first endpoint: ${response1.statusText}`);
//     // }

//     // console.log('Response status from /tosendworks:', response1.status);
//     const data1 = await response1.json();
//     console.log(data1)
    
//     // Check if data1 is valid
//     // if (!data1) {
//     //   throw new Error('No data received from /tosendworks');
//     // }

//     // const response2 = await fetch('http://localhost:3005/sendmail', {
//     //   method: 'POST',
//     //   headers: {
//     //     'Content-Type': 'application/json',
//     //   },
//     //   //body: JSON.stringify(data1), // Send data1 as JSON body
//     // });

//     // console.log('Response status from sendmail:', response2.status);

//     // if (!response2.ok) {
//     //   throw new Error(`Failed to send data to second endpoint: ${response2.statusText}`);
//     // }

//     // const data = await response2.json();
//     // console.log('API Response from sendmail:', data);

//   } catch (err) {
//     console.error('Error:', err);
//   }
// }


app.post('/getmailwork', async (c) => {
  const b = await c.req.json();
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.mailworks.findMany({
      where:{
        project_id:b.id
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      error:error,
      success:false
    });
  }finally{
    prisma.$disconnect();
  }
});


app.post('/addmailwork', async (c) => {
  const b = await c.req.json();
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.mailworks.create({
      data:{
        work_id:b.work_id,
        title:b.title,
        description:b.description,
        email:b.email,
        project_id:b.project_id
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
});

app.post('/deletemailwork', async (c) => {
  const b = await c.req.json();
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.mailworks.deleteMany({
      where:{
        work_id:b.id
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
});



app.post('/deletemailsubwork', async (c) => {
  const b = await c.req.json();
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.mailsubworks.deleteMany({
      where:{
        subwork_id:b.id
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
});


app.post('/getmailsubwork', async (c) => {
  const b = await c.req.json();
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.mailsubworks.findMany({
      where:{
        project_id:b.id
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      error:error,
      success:false
    });
  }finally{
    prisma.$disconnect();
  }
});


app.post('/addmailsubwork', async (c) => {
  const b = await c.req.json();
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.mailsubworks.create({
      data:{
        subwork_id:b.subwork_id,
        title:b.title,
        description:b.description,
        email:b.email,
        project_id:b.project_id
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
});










app.post('/', async (c) => {
  return c.json({
    message:"hi"
  })
})


app.post('/addquote', async (c) => {
  const b = await c.req.json();
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.quotes.create({
      data:{
        quote:b.quote
      },
      select:{
        quote:true
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
});

app.post('/getquote/:id', async (c) => {
  const quote_id = parseInt(c.req.param('id'));
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.quotes.findUnique({
      where:{
        id:quote_id
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
});


app.post('/signup',signupMIddleware, async (c) => {
  const b = await c.req.json();
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)

  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.user.create({
      data:{
        name: b.name,
        username: b.username,
        password:b.password,
        private: false,
        notifications:0,
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
        calenderevents:true
      }
    });
    const token = await jwtsign(b.username);
    return c.json({
      res: res,
      token:token
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
});


app.post('/signin',signinMIddleware, async (c:any) => {
  
  const b = await c.req.json();
  const token = await jwtsign(b.username);
  const allData = c.get("alluserinfo");
  

  return c.json({
    token:token,
    data:allData
  })  
});

app.post('/getalldashboard',authtoken, async (c:any) => {
  
  const x = await c.get('userinfo');
  const id = x.id;
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
        const prisma = new PrismaClient({
            datasourceUrl: DATABASE_URL,
        }).$extends(withAccelerate());
        try{
            const ress = await prisma.user.findFirst({
                where:{
                    id:id
                },
                select:{
                    id:true,
                    name:true,
                    username:true,
                    created_at:true,
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
                    calenderevents:true,
                }
            })
            if(ress){
              return c.json({
                success:true,
                data:ress
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
        return c.json({
            message:"no user found"
        })
  

    
});



app.post('/createworkhistory',authtoken, async (c:any)=>{
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.workhistory.create({
      data:{
        user_id:id,
        name: b.title,
        hoursWorked: b.hoursWorked,
        minsWorked:b.minsWorked,
        startHour:b.startHour,
        startMinute:b.startMinute,
        endHour:b.endHour,
        endMinute:b.endMinute
      },
      select:{
        id:true
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    //console.error('Error creating work history', error);
    return c.text('Error creating work history', 500);
  }finally{
    prisma.$disconnect();
  }
})


app.post('/getworkhistory',authtoken, async (c:any)=>{
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.workhistory.findMany({
      where:{
        user_id:id
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    //console.error('Error creating work history', error);
    return c.text('Error creating work history', 500);
  }finally{
    prisma.$disconnect();
  }
})








app.post('/createtodo',authtoken, async (c:any)=>{
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.todo.create({
      data:{
        title: b.title,
        description: b.description,
        user_id:id,
        completed:true
      },
      select:{
        id:true,
        title: true,
        description:true,
        user:true,
        completed:true
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})


app.get('/gettodo',authtoken, async (c:any)=>{
  const x = await c.get('userinfo');
  return c.json({
    Message: x
  })
})

app.get('/getdeltodo',authtoken, async (c:any)=>{
  const x = await c.get('userinfo');
  return c.json({
    Message: x
  })
})





app.post('/deletetodo',authtoken, async (c:any)=>{
  
  const b = await c.req.json();
  const id = b.id;
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.todo.delete({
      where:{
        id:id
      },
      select:{
        id:true,
        title: true,
        user_id: true,
        description:true,
        completed:true,
        user:true
      }
    });

    if(!res){
      return c.json({
        message:"error"
      })
    }

    const res2 = await prisma.todobin.create({
      data:{
        title:res.title,
        description:res.description,
        completed:res.completed,
        user_id : res.user_id
      },
      select:{
        id:true,
        title: true,
        description:true,
        completed:true,
        user:true
      }
    });
    

    return c.json({
      res: res,
      res2
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})

app.post('/deletefinal',authtoken, async (c:any)=>{
  
  const b = await c.req.json();
  const id = b.id;
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.todobin.delete({
      where:{
        id:id
      },
      select:{
        id:true,
      }
    });

    if(!res){
      return c.json({
        message:"error"
      })
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})

app.post('/restore',authtoken, async (c:any)=>{
  
  const b = await c.req.json();
  const id = b.id;
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.todobin.delete({
      where:{
        id:id
      },
      select:{
        id:true,
        title: true,
        user_id: true,
        description:true,
        completed:true,
        user:true,
      }
    });

    if(!res){
      return c.json({
        message:"error"
      })
    }

    const res2 = await prisma.todo.create({
      data:{
        title:res.title,
        description:res.description,
        completed:res.completed,
        user_id : res.user_id
      },
      select:{
        id:true,
        title: true,
        description:true,
        completed:true,
        user:true
      }
    });
    

    return c.json({
      res: res,
      res2
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})


app.post('/updatetodo',authtoken, async (c:any)=>{
  
  const b = await c.req.json();
  const id = b.id;
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.todo.update({
      where: {
        id: id,
      },
      data: {
        title: b.title,
        description: b.description,
        completed: b.completed,
      },
      select: {
        id: true,
        title: true,
        user_id: true,
        description: true,
        completed: true,
        user: true,
      },
    });
    

    if(!res){
      return c.json({
        message:"error"
      })
    }
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})

app.post('/updatetodo',authtoken, async (c:any)=>{
  
  const b = await c.req.json();
  const id = b.id;
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.todo.update({
      where: {
        id: id,
      },
      data: {
        title: b.title,
        description: b.description,
        completed: b.completed,
      },
      select: {
        id: true,
        title: true,
        user_id: true,
        description: true,
        completed: true,
        user: true,
      },
    });
    

    if(!res){
      return c.json({
        message:"error"
      })
    }
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})

app.post('/updateusername',authtoken, async (c:any)=>{
  
  const b = await c.req.json();
  const id = b.id;
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        name: b.name,
      },
      select: {
        id: true,
        name: true,
        username: true,
        todo: true,
      },
    });
    

    if(!res){
      return c.json({
        message:"error"
      })
    }
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})


app.post('/updateuserpassword',authtoken, async (c:any)=>{
  
  const b = await c.req.json();
  const id = b.id;
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        password: b.password,
      },
      select: {
        id: true,
        name: true,
        username: true,
        todo: true,
      },
    });
    

    if(!res){
      return c.json({
        message:"error"
      })
    }
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})


app.post('/updateuserusername',authtoken, async (c:any)=>{
  
  const b = await c.req.json();
  const id = b.id;
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        username: b.username,
      },
      select: {
        id: true,
        name: true,
        username: true,
        todo: true,
      },
    });

    
    if(!res){
      return c.json({
        message:"error"
      })
    }

    const token = await jwtsign(b.username);
    return c.json({
      token:token,
      res: res
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})


// app.post('/createnote',authtoken, async (c:any)=>{
//   const b = await c.req.json();
//   const x = await c.get('userinfo');
//   const id = x.id;

//   const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.notes.create({
//       data:{
//         title: b.title,
//         description: b.description,
//         user_id:id,
//         folder_id:b.folderid,
//         archive: false
//       },
//       select:{
//         id:true,
//         title: true,
//         description:true,
//         user:true,
//         archive:true,
//         folder_id:true
//       }
//     });
//     return c.json({
//       res: res,
//     });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.text('Internal Server Error', 500);
//   }finally{
//     prisma.$disconnect();
//   }
// })


// app.get('/getnotes',notesauth, async (c:any)=>{
//   const x = await c.get('userinfo');
//   return c.json({
//     Message: x
//   })
// })

app.post('/createfolder',authtoken, async (c:any)=>{
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.folder.create({
      data:{
        title: b.title,
        user_id:id,
        color:b.color,
        archive: false
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})


app.post('/getfolders',authtoken, async (c:any)=>{
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.folder.findMany({
      where:{
        user_id:id,
      },
      select:{
        id:true,
        title: true,
        user:true,
        archive:true,
        created_at:true
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})

app.post('/editfolder',authtoken, async (c:any)=>{
  
  const b = await c.req.json();
  const id = b.id;
  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.folder.update({
      where: {
        user_id: id,
        id:b.folder
      },
      data: {
        title: b.title,
      }
    });
    

    if(!res){
      return c.json({
        message:"error"
      })
    }
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})





// app.post('/createproject',authtoken, async (c:any)=>{
//   const b = await c.req.json();
//   const x = await c.get('userinfo');
//   const id = x.id;

//   const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.project.create({
//       data:{
//         title: b.title,
//         description:b.description,
//         link:b.link,
//         user_id:id,
//         folder_id:b.folder,
//         archive: false,
//         done:false
//       }
//     });
//     return c.json({
//       res: res,
//     });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.text('Internal Server Error', 500);
//   }finally{
//     prisma.$disconnect();
//   }
// })


// app.post('/getprojectoffolder',authtoken, async (c:any)=>{
//   const b = await c.req.json();
//   const x = await c.get('userinfo');
//   const id = x.id;

//   const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.project.findMany({
//       where:{
//         user_id:id,
//         folder_id:b.folder,
//       },
//       select:{
//         works:true,
//         subworks:true,
//         id:true,              
//         user_id:true,         
//         folder_id:true,       
//         title:true,           
//         description :true,    
//         link :true,
//         archive:true,
//         done:true,
//         created_at:true,
//         hashtag:true           
//       }
//     });
//     return c.json({
//       res: res,
//     });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.text('Internal Server Error', 500);
//   }finally{
//     prisma.$disconnect();
//   }
// })






// app.post('/editproject',authtoken, async (c:any)=>{
  
//   const b = await c.req.json();
//   const id = b.id;
//   const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.project.update({
//       where: {
//         id:b.project
//       },
//       data: {
//         title: b.title,
//         description:b.description,
//         link:b.link,
//         archive:b.archive,
//         done:b.done
//       }
//     });
    

//     if(!res){
//       return c.json({
//         message:"error"
//       })
//     }
//     return c.json({
//       res: res,
//     });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.text('Internal Server Error', 500);
//   }finally{
//     prisma.$disconnect();
//   }
// })


// app.post('/inviteusertoproject',authtoken, async (c:any)=>{
  
//   const b = await c.req.json();
//   const id = b.id;
//   const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.projectInvite.create({
//       data:{
//         project_id:b.projectid,
//         user_id:b.id,
//         accepted:true
//       }
//     });
//     return c.json({
//       res: res,
//     });
    
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.text('Internal Server Error', 500);
//   }finally{
//     prisma.$disconnect();
//   }
// })







// app.post('/creatework',authtoken, async (c:any)=>{
//   const b = await c.req.json();
//   const x = await c.get('userinfo');
//   const id = x.id;

//   const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.works.create({
//       data:{
//         work: b.work,
//         description:b.description,
//         project_id:b.project,
//         assignto:id
//       }
//     });
//     return c.json({
//       res: res,
//     });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.text('Internal Server Error', 500);
//   }finally{
//     prisma.$disconnect();
//   }
// })

// app.post('/getwork',authtoken, async (c:any)=>{
//   const b = await c.req.json();
//   const x = await c.get('userinfo');
//   const id = x.id;

//   const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.works.findMany({
//       where:{
//         project_id:b.project_id
//       }
//     });
//     return c.json({
//       res: res,
//     });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.text('Internal Server Error', 500);
//   }finally{
//     prisma.$disconnect();
//   }
// })

// app.post('/assignwork',authtoken, async (c:any)=>{
//   const b = await c.req.json();
//   const x = await c.get('userinfo');
//   const id = x.id;

//   const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.works.update({
//       where: {
//         id:b.workid
//       },
//       data: {
//         assignto:b.assign
//       }
//     });
//     if(!res){
//       return c.json({
//         message:"error"
//       })
//     }
//     return c.json({
//       res: res,
//     });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.text('Internal Server Error', 500);
//   }finally{
//     prisma.$disconnect();
//   }
// })



// app.post('/editwork',authtoken, async (c:any)=>{
//   const b = await c.req.json();
//   const x = await c.get('userinfo');
//   const id = x.id;

//   const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.works.update({
//       where: {
//         id:b.workid
//       },
//       data: {
//         work:b.work,
//         description:b.description
//       }
//     });
//     if(!res){
//       return c.json({
//         message:"error"
//       })
//     }
//     return c.json({
//       res: res,
//     });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.text('Internal Server Error', 500);
//   }finally{
//     prisma.$disconnect();
//   }
// })






// app.post('/createsubwork',authtoken, async (c:any)=>{
//   const b = await c.req.json();
//   const x = await c.get('userinfo');
//   const id = x.id;

//   const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.subWorks.create({
//       data:{
//         subwork: b.work,
//         subdescription:b.description,
//         project_id:b.projectid,
//         assignto:id,
//         work_id:b.workid
//       }
//     });
//     return c.json({
//       res: res,
//     });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.text('Internal Server Error', 500);
//   }finally{
//     prisma.$disconnect();
//   }
// })

// app.post('/assignsubwork',authtoken, async (c:any)=>{
//   const b = await c.req.json();
//   const x = await c.get('userinfo');
//   const id = x.id;

//   const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.subWorks.update({
//       where: {
//         id:b.workid
//       },
//       data: {
//         assignto:b.assign
//       }
//     });
//     if(!res){
//       return c.json({
//         message:"error"
//       })
//     }
//     return c.json({
//       res: res,
//     });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.text('Internal Server Error', 500);
//   }finally{
//     prisma.$disconnect();
//   }
// })



// app.post('/editsubwork',authtoken, async (c:any)=>{
//   const b = await c.req.json();
//   const x = await c.get('userinfo');
//   const id = x.id;

//   const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.subWorks.update({
//       where: {
//         id:b.workid
//       },
//       data: {
//         subwork:b.work,
//         subdescription:b.description
//       }
//     });
//     if(!res){
//       return c.json({
//         message:"error"
//       })
//     }
//     return c.json({
//       res: res,
//     });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.text('Internal Server Error', 500);
//   }finally{
//     prisma.$disconnect();
//   }
// })




// app.post('/getmyworks',authtoken, async (c:any)=>{
//   const b = await c.req.json();
//   const x = await c.get('userinfo');
//   const id = x.id;

//   const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.works.findMany({
//       where: {
//         assignto:id
//       },
//       select:{
//         id:true,
//         project_id:true,
//         work:true,
//         description:true,
//         subworks:true

//       }
//     });
//     if(!res){
//       return c.json({
//         message:"error"
//       })
//     }
//     return c.json({
//       res: res,
//     });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.text('Internal Server Error', 500);
//   }finally{
//     prisma.$disconnect();
//   }
// })


app.post('/createprojectfolder', authtoken, async (c: any) => {
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Create the project first
    const project = await prisma.folderproject.create({
      data: {
        name: b.name,
        user_id: id,
        important: false,
        color: "white",
        tags: "none"
      }
    });

    // Create tasks (Works) associated with the project
    
    return c.json({
      res: project,
      success: true
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    return c.json({message:'Internal Server Error',success:false}, 500);
  } finally {
    prisma.$disconnect();
  }
});


app.post('/getprojectfolder', authtoken, async (c: any) => {
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Create the project first
    const project = await prisma.folderproject.findMany({
      where:{
        user_id: id
      },select:{
        id:true,
        name:true,
        color:true,
        created_at:true,
        parentId:true,
        important:true
      }
    });

    // Create tasks (Works) associated with the project
    
    return c.json({
      res: project,
      success: true
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    return c.json({message:'Internal Server Error',success:false}, 500);
  } finally {
    prisma.$disconnect();
  }
});

app.post('/deleteprojectfolder', authtoken, async (c: any) => {
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Create the project first
    const project = await prisma.folderproject.delete({
      where:{
        id: b.id,
        user_id: id
      }
    });

    // Create tasks (Works) associated with the project
    
    return c.json({
      res: project,
      success: true
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return c.json({message:'Internal Server Error',success:false}, 500);
  } finally {
    prisma.$disconnect();
  }
});




app.post('/putprojectinfolder', authtoken, async (c: any) => {
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Create the project first
    const project = await prisma.project.update({
      where:{
        id: b.id,
        user_id: id
      },data:{
        folderproject_id:b.folder_id
      }
    });

    // Create tasks (Works) associated with the project
    
    return c.json({
      res: project,
      success: true
    });
  } catch (error) {
    console.error('Error adding to folder:', error);
    return c.json({message:'Internal Server Error',success:false}, 500);
  } finally {
    prisma.$disconnect();
  }
});


app.post('/createproject', authtoken, async (c: any) => {
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Create the project first
    const project = await prisma.project.create({
      data: {
        title: b.title,
        description: b.description,
        link: b.link,
        user_id: id,
        folder_id: b.folder,
        archive: false,
        done: false,
        folderproject_id: null
      },
    });

    // Create tasks (Works) associated with the project
    const tasks = await prisma.works.createMany({
      data: b.tasks.map((task: any) => ({
        work: task.work,
        completed:task.completed,
        description: task.description,
        project_id: project.id,
        assignto: task.assignto || id, // Assign to specified user or default to creator
      })),
    });

    // Fetch the created tasks to get their IDs
    const createdTasks = await prisma.works.findMany({
      where: {
        project_id: project.id,
      },
    });

    // Create subtasks (SubWorks) associated with each task
    for (const task of createdTasks) {
      await prisma.subWorks.createMany({
        data: b.tasks
          .find((t: any) => t.work === task.work)
          .subtasks.map((subtask: any) => ({
            subwork: subtask.subwork,
            subdescription: subtask.subdescription,
            completed: subtask.completed,
            work_id: task.id,
            project_id: project.id,
            assignto: subtask.assignto || id, // Assign to specified user or default to creator
          })),
      });
    }

    return c.json({
      res: project,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return c.text('Internal Server Error', 500);
  } finally {
    prisma.$disconnect();
  }
});




app.post('/addwork', authtoken, async (c: any) => {
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;
  console.log(b);

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Create the project first
    const newsubwork = await prisma.works.create({
      data: {
        work: b.title,
        description: b.description,
        assignto: b.assignto || id,
        project_id: b.project_id,
        completed: false,
      },
    });

    return c.json({
      res: newsubwork,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return c.text('Internal Server Error', 500);
  } finally {
    prisma.$disconnect();
  }
});





app.post('/addsubwork', authtoken, async (c: any) => {
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;
  //console.log(b);

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Create the project first
    const newsubwork = await prisma.subWorks.create({
      data: {
        subwork: b.title,
        subdescription: b.description,
        work_id: b.work_id,
        assignto: b.assignto || id,
        project_id: b.project_id,
        completed: false,
      },
    });

    return c.json({
      res: newsubwork,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return c.text('Internal Server Error', 500);
  } finally {
    prisma.$disconnect();
  }
});

app.post('/deletesubwork', authtoken, async (c: any) => {
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;
  //console.log(b);

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Create the project first
    const newsubwork = await prisma.subWorks.delete({
      where: {
        id:b.id
      },select:{
        id:true
      }
    });

    return c.json({
      res: newsubwork,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return c.text('Internal Server Error', 500);
  } finally {
    prisma.$disconnect();
  }
});


app.post('/deletework', authtoken, async (c: any) => {
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;
  //console.log(b);

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Create the project first
    const newsubwork = await prisma.works.delete({
      where: {
        id:b.id
      },select:{
        id:true
      }
    });

    return c.json({
      res: newsubwork,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return c.text('Internal Server Error', 500);
  } finally {
    prisma.$disconnect();
  }
});




app.post('/invitedusers', authtoken, async (c:any) => {
  const b = await c.req.json();
  //console.log(b);

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const allUsersExceptCurrent = await prisma.projectInvite.findMany({
      where: {
        project_id: b.project_id,
      },
      select: {
        id: true,
        user_id:true,
        accepted:true,
        user: {
          select:{
            id:true,
            name:true,
            username:true
          }
        }
      },
    });
    //console.log(allUsersExceptCurrent);
    return c.json({ res: allUsersExceptCurrent });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    await prisma.$disconnect();
  }
});





app.post('/inviteUserToProject', authtoken, async (c: any) => {
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;
  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.projectInvite.create({
      data: {
        project_id: b.project_id,
        user_id: b.user_id,
        accepted: false,  // Default to false until the user accepts the invite
      },
      select: {
        id: true,
        project_id: true,
        user_id: true,
        accepted: true,
        user:{
          select:{
            id:true,
            name:true,
            username:true
          }
        }
      },
    });
    //console.log(res.user);
    console.log(res);
    const response2 = await fetch('https://mailexpress.vercel.app/sendnotif', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(res.user), // Send data1 as JSON body
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error inviting user to project:', error);
    return c.text('Internal Server Error', 500);
  } finally {
    await prisma.$disconnect();
  }
});


app.post('/acceptinvite', authtoken, async (c: any) => {
  const b = await c.req.json();
  //const x = await c.get('userinfo');
  //const id = x.id;
  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.projectInvite.update({
      where: {
        id:b.id
      },
      data:{
        accepted:true
      },
      select:{
        user_id:true
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error inviting user to project:', error);
    return c.text('Internal Server Error', 500);
  } finally {
    await prisma.$disconnect();
  }
});




app.post('/removeinvite', authtoken, async (c: any) => {
  const b = await c.req.json();
  //const x = await c.get('userinfo');
  //const id = x.id;
  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.projectInvite.delete({
      where: {
        id:b.id
      },
      select:{
        user_id:true
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error inviting user to project:', error);
    return c.text('Internal Server Error', 500);
  } finally {
    await prisma.$disconnect();
  }
});






app.post('/getprojects',authtoken, async (c:any)=>{
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const createdProjects = await prisma.project.findMany({
      where: {
        user_id: userId,
      },
      include: {
        hashtag: true,
        works: true,
        projectmessages: true,
        subworks: true,
        projectinvite: true,
        user: true,
        folder: true,
        folderproject:true
      },
    });
  
    // 2. Query projects the user was invited to and accepted
    const invitedProjects = await prisma.projectInvite.findMany({
      where: {
        user_id: userId,
        accepted: true,
      },
      include: {
        folder: {
          include: {
            hashtag: true,
            works: true,
            projectmessages: true,
            subworks: true,
            projectinvite: true,
            user: true,
            folder: true,
          }
        }
      }
    });
  
    // Extract project IDs from the invitations
    const invitedProjectIds = invitedProjects.map(invite => invite.project_id);
  
    // Query for the detailed information of the invited projects
    const invitedProjectsDetails = await prisma.project.findMany({
      where: {
        id: {
          in: invitedProjectIds,
        },
      },
      include: {
        hashtag: true,
        works: true,
        projectmessages: true,
        subworks: true,
        projectinvite: true,
        user: true,
        folder: true,
      },
    });
  
    // Combine both lists
    const allProjects = [
      ...createdProjects,
      ...invitedProjectsDetails,
    ];
  
    // Remove duplicates based on project ID
    const uniqueProjects = Array.from(new Map(allProjects.map(project => [project.id, project])).values());
    return c.json({
      res: uniqueProjects,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})




app.get('/getuserprojects', authtoken, async (c: any) => {
  const x = await c.get('userinfo');
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Fetch the details of all projects created by the user
    const userProjects = await prisma.project.findMany({
      where: {
        user_id: userId,
      },
      // include: {
      //   works: {
      //     include: {
      //       subworks: true, // Include subtasks for each task
      //     },
      //   },
      //   hashtag: true, // Include hashtags if applicable
      //   projectmessages: true, // Include project messages if applicable
      //   projectinvite: true, // Include project invitations if applicable
      //   user: true, // Include the user who created the project
      //   folder: true, // Include folder details if applicable
      // },
      select:{
        id:true,
        important:true,
        title:true,
        description:true,
        user_id:true,
        created_at:true,
        link:true,
        done:true,
        archive:true,
        folder_id:true,
        folderproject:true
      }
    });

    return c.json({
      res: userProjects,
    });
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});




app.post('/updateproject', authtoken, async (c: any) => {
  const x = await c.get('userinfo');
  const userId = x.id;
  const b = await c.req.json();

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const userProjects = await prisma.project.update({
      where: {
        id: b.id
      },
      data:{
        important:b.important
      }
    });

    return c.json({
      res: userProjects,
      success:true
    });
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return c.json({
      error,
      success:false
    });
  } finally {
    prisma.$disconnect();
  }
});


app.post('/updatework', authtoken, async (c: any) => {
  const b = await c.req.json();

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const userProjects = await prisma.works.update({
      where: {
        id: b.workid
      },
      data:{
        assignto:b.userid
      }
    });

    return c.json({
      res: userProjects,
    });
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});

app.post('/updatesubwork', authtoken, async (c: any) => {
  const b = await c.req.json();

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const userProjects = await prisma.subWorks.update({
      where: {
        id: b.workid
      },
      data:{
        assignto:b.userid
      }
    });

    return c.json({
      res: userProjects,
    });
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});



//delete project chatgpt
app.delete('/deleteproject/:id', authtoken, async (c: any) => {
  const { id } = c.req.param();
  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Delete the project by ID
    await prisma.project.delete({
      where: {
        id: Number(id),
      },
    });

    return c.json({
      message: `Project with ID ${id} deleted`,
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});


app.get('/getproject/:id', authtoken, async (c: any) => {
  const { id } = c.req.param();
  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Delete the project by ID
    const res  = await prisma.project.findUnique({
      where: {
        id: Number(id),
      },
      select:{
        id:true,
        user_id:true,
        folder_id:true,
        title:true,
        description:true,
        link:true,
        archive:true,
        done:true,
        created_at:true,
        works:true,
        subworks:true
      }
    });

    return c.json({
      res
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});




app.post('/updateSubWork',authtoken, async (c:any)=>{
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.subWorks.update({
      where:{
        id:b.subworkId
      },
      data:{
        subwork:b.title,
        subdescription:b.description,
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      error,
      success:false
    });
  }finally{
    prisma.$disconnect();
  }
})









app.post('/updateSubWorkCompletion',authtoken, async (c:any)=>{
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.subWorks.update({
      where:{
        id:b.subworkId
      },
      data:{
        completed:b.completed
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})



app.post('/updateWork',authtoken, async (c:any)=>{
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.works.update({
      where:{
        id:b.workId
      },
      data:{
        work:b.title,
        description:b.description
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      error,
      success:false
    });
  }finally{
    prisma.$disconnect();
  }
})






app.post('/updateWorkCompletion',authtoken, async (c:any)=>{
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.works.update({
      where:{
        id:b.workId
      },
      data:{
        completed:b.completed
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})









app.post('/editproject', authtoken, async (c: any) => {
  const b = await c.req.json();
  const id = b.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Update the project details
    const project = await prisma.project.update({
      where: {
        id: b.project,
      },
      data: {
        title: b.title,
        description: b.description,
        link: b.link,
        archive: b.archive,
        done: b.done,
      },
    });

    // Update or create tasks (Works) associated with the project
    for (const task of b.tasks) {
      if (task.id) {
        // If the task already exists, update it
        await prisma.works.update({
          where: {
            id: task.id,
          },
          data: {
            work: task.work,
            description: task.description,
            assignto: task.assignto,
          },
        });
      } else {
        // If the task does not exist, create it
        await prisma.works.create({
          data: {
            work: task.work,
            completed:task.completed,
            description: task.description,
            project_id: project.id,
            assignto: task.assignto || id,
          },
        });
      }
    }

    // Update or create subtasks (SubWorks) associated with each task
    for (const task of b.tasks) {
      if (task.subtasks) {
        for (const subtask of task.subtasks) {
          if (subtask.id) {
            // If the subtask already exists, update it
            await prisma.subWorks.update({
              where: {
                id: subtask.id,
              },
              data: {
                subwork: subtask.subwork,
                subdescription: subtask.subdescription,
                assignto: subtask.assignto,
              },
            });
          } else {
            // If the subtask does not exist, create it
            await prisma.subWorks.create({
              data: {
                subwork: subtask.subwork,
                completed:subtask.completed,
                subdescription: subtask.subdescription,
                work_id: task.id,
                project_id: project.id,
                assignto: subtask.assignto || id,
              },
            });
          }
        }
      }
    }

    return c.json({
      res: project,
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return c.text('Internal Server Error', 500);
  } finally {
    prisma.$disconnect();
  }
});


// till here



app.post('/createprojectmessage',authtoken, async (c:any)=>{
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.projectMessages.create({
      data:{
        sender_id: id,
        project_id:b.projectid,
        content: b.content,
        important:false
      },
      select:{
        content:true,
        created_at:true,
        sender_id:true,
        project_id:true
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})

//COUNT
app.get('/getprojectcounts', authtoken, async (c: any) => {
  const x = await c.get('userinfo');
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Count the number of projects created by the user
    const createdProjectsCount = await prisma.project.count({
      where: {
        user_id: userId,
      },
    });

    // Find the number of projects where the user is assigned work or sub-work
    const assignedProjectsCount = await prisma.projectInvite.count({
      where: {
        user_id:userId,
        accepted:true
      },
    });

    return c.json({
      createdProjectsCount,
      assignedProjectsCount,
    });
  } catch (error) {
    console.error('Error fetching project counts:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});

app.get('/getinvites', authtoken, async (c: any) => {
  const x = await c.get('userinfo');
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Count the number of projects created by the user
    const res = await prisma.project.findMany({
      where: {
        projectinvite:{
          some:{
            user_id:userId,
            accepted:false
          }
        }
      },select:{
        id:true,
        user_id:true,
        folder_id:true,
        title:true,
        description:true,
        link:true,
        hashtag:true,
        projectinvite:{
          select:{
            id:true
          }
        }
      }
    });

    return c.json({
      res
    });
  } catch (error) {
    console.error('Error fetching project counts:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});


app.get('/getassignedprojects', authtoken, async (c: any) => {
  const x = await c.get('userinfo');
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Count the number of projects created by the user
    const res = await prisma.project.findMany({
      where: {
        projectinvite:{
          some:{
            user_id:userId,
            accepted:true
          }
        }
      },
      select:{
        id:true,
        user_id:true,
        folder_id:true,
        title:true,
        description:true,
        link:true,
        archive:true,
        important:true,
        done:true,
        created_at:true,
        projectinvite:{
          select:{
            id:true,
            user_id:true,
            important:true
          }
        }
      }
    });

    return c.json({
      res
    });
  } catch (error) {
    console.error('Error fetching project counts:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});




app.post('/updateassignedprojectimportant', authtoken, async (c: any) => {
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const userId = x.id;
  const id = b.id;
  const important = b.important;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Count the number of projects created by the user
    const res = await prisma.projectInvite.update({
      where: {
        id:id
      },data:{
        important:important
      }
    });

    return c.json({
      res,
      success:true
    });
  } catch (error) {
    console.error('Error fetching project counts:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});








app.get('/getnotifs', authtoken, async (c: any) => {
  const x = await c.get('userinfo');
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Count the number of projects created by the user
    const res = await prisma.project.findMany({
      where: {
        projectinvite:{
          some:{
            user_id:userId,
            accepted:false
          }
        }
      },
      select:{
        id:true,
        user_id:true,
        folder_id:true,
        title:true,
        description:true,
        link:true,
        archive:true,
        created_at:true,
        projectinvite:{
          select:{
            id:true,
            user_id:true
          }
        }
      }
    });

    return c.json({
      res
    });
  } catch (error) {
    console.error('Error fetching project counts:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});

app.get('/getuserprojectswithworks', authtoken, async (c: any) => {
  const x = await c.get('userinfo');
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Count the number of projects created by the user
    const res = await prisma.user.findUnique({
      where: {
        id:userId
      },
      select:{
        id:true,
        username:true,
        name:true,
        created_at:true,
        private:true,
        projects:{
          select:{
            title:true,
            description:true,
            created_at:true,
            works:true,
            subworks:true
          }
        }
      }
    });

    return c.json({
      res
    });
  } catch (error) {
    console.error('Error fetching project counts:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});




app.get('/getprojectmessages/:id', authtoken, async (c:any) => {
  const project_id = parseInt(c.req.param('id')); // Parse the receiver_id from URL parameters
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());
  
  try {
    const messages = await prisma.projectMessages.findMany({
      where: {
        project_id:project_id
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    return c.json({ res: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});






app.post('/createmessage',authtoken, async (c:any)=>{
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.message.create({
      data:{
        sender_id: id,
        receiver_id:b.receiver_id,
        content: b.content,
        important:false
      },
      select:{
        content:true,
        created_at:true,
        sender_id:true,
        receiver_id:true
      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})

app.post('/createprojectmessage/:id',authtoken, async (c:any)=>{
  const project_id = parseInt(c.req.param('id'));
  const b = await c.req.json();
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.projectMessages.create({
      data:{
        sender_id: id,
        project_id :project_id,
        content: b.content,
        important:false
      },
      select:{
        content:true,
        created_at:true,
        sender_id:true,
        project_id:true

      }
    });
    return c.json({
      res: res,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})

app.get('/getProjectmessages/:id', authtoken, async (c:any) => {
  const project_id = parseInt(c.req.param('id')); // Parse the receiver_id from URL parameters
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());
  
  try {
    const messages = await prisma.projectMessages.findMany({
      where: {
        project_id:project_id
      },
      select: {
        content: true,
        created_at: true,
        sender_id: true,
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    return c.json({ res: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});






app.get('/getmessages/:id', authtoken, async (c:any) => {
  const receiver_id = parseInt(c.req.param('id')); // Parse the receiver_id from URL parameters
  const x = await c.get('userinfo');
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());
  
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: id, receiver_id: receiver_id },
          { sender_id: receiver_id, receiver_id: id }
        ]
      },
      select: {
        content: true,
        created_at: true,
        sender_id: true,
        receiver_id: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    return c.json({ res: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    prisma.$disconnect();
  }
});


app.get('/getcontacts', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); // Adjust this to however you're retrieving user info
  const id = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    // Find all messages involving the user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: id },
          { receiver_id: id }
        ]
      },
      select: {
        sender_id: true,
        receiver_id: true
      }
    });

    // Extract unique user IDs
    const userIds = new Set();
    messages.forEach(message => {
      if (message.sender_id !== id) userIds.add(message.sender_id);
      if (message.receiver_id !== id) userIds.add(message.receiver_id);
    });

    // Fetch user details for unique user IDs
    const users = await prisma.user.findMany({
      where: {
        //@ts-ignore
        id: { in: Array.from(userIds) }
      },
      select: {
        id: true,
        name: true,
        username: true
      }
    });

    return c.json({ res: users });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    await prisma.$disconnect();
  }
});


app.get('/getallusers', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const allUsersExceptCurrent = await prisma.user.findMany({
      where: {
        NOT: {
          id: userId,
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        private:true,

      },
    });

    return c.json({ res: allUsersExceptCurrent });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.status(500).text('Internal Server Error');
  } finally {
    await prisma.$disconnect();
  }
});



app.post('/checkforupdate',authtoken, async (c:any)=>{
  const b = await c.req.json();

  const { DATABASE_URL } = env<{ DATABASE_URL:string }>(c)
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.works.findMany({
      where:{
        project_id:b.id
      },
      select:{
        id:true,
        assignto:true,
        completed:true,
      }
    });
    const res1 = await prisma.subWorks.findMany({
      where:{
        project_id:b.id
      },
      select:{
        id:true,
        assignto:true,
        completed:true
      }
    });
    
    console.log(b.simplifiedWorks);
    console.log(res);
    for(const x of res){
      var found = false;
      for(const y of b.simplifiedWorks){
        if(x.id == y.id){
          found = true;
          if(x.assignto!=y.assignto){
            return c.json({ res: true });
          }
          if(x.completed!=y.completed){
            return c.json({ res: true });
          }
        }
      }
      if(!found){
        return c.json({ res: true });
      }
    }
    for(const x of res1){
      var found = false;
      for(const y of b.simplifiedSubworks){
        if(x.id == y.id){
          found = true;
          if(x.assignto!=y.assignto){
            return c.json({ res: true });
          }
          if(x.completed!=y.completed){
            return c.json({ res: true });
          }
        }
      }
      if(!found){
        return c.json({ res: true });
      }
    }
    return c.json({ res: false });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.text('Internal Server Error', 500);
  }finally{
    prisma.$disconnect();
  }
})




app.post('/addevent', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const body = await c.req.json();
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.calenderevents.create({
      data:{
        user_id: userId,
        title :body.title,
        description: body.description,
        color:body.color,
        start:body.start,
        end:body.end
      },
      select:{
        id:true
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});

app.get('/getevents', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.calenderevents.findMany({
      where:{
        user_id: userId
      },
      select:{
        id:true,
        title:true,
        description:true,
        color:true,
        start:true,
        end:true
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});






app.post('/deleteevents', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const body = await c.req.json();
  //const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.calenderevents.delete({
      where:{
        id: body.event_id
      },
      select:{
        id:true,
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});




app.post('/addweekevent', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const body = await c.req.json();
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.weektask.create({
      data:{
        user_id: userId,
        task :body.task,
        completed:false,
        date:body.date
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});



app.post('/updateweekevent', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const body = await c.req.json();
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.weektask.update({
      where:{
        id:body.id
      },
      data:{
        completed:body.completed,
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});

app.get('/getweekevents', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 }); // 1 = Monday
    const tasks = await prisma.weektask.findMany({
      where: {
        date: {
          gte: monday, // Greater than or equal to Monday
         
        },
        user_id:userId
      },
    });
    // const res = await prisma.weektask.findMany({
    //   where:{
    //     user_id: userId
    //   }
    // });
    return c.json({
      res: tasks,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});



app.get('/getlastweekevents', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const lastMonday = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    const lastSunday = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });

    // Query tasks from last Monday to last Sunday
    const tasks = await prisma.weektask.findMany({
      where: {
        date: {
          gte: lastMonday, // Greater than or equal to last Monday
          lte: lastSunday, // Less than or equal to last Sunday
        },
        user_id: userId,
        completed:false
      },
    });
    // const res = await prisma.weektask.findMany({
    //   where:{
    //     user_id: userId
    //   }
    // });
    return c.json({
      res: tasks,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});

// app.get('/getweekevents', authtoken, async (c:any) => {
//   const x = await c.get('userinfo'); // Assuming this retrieves user info 
//   const userId = x.id;

//   const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
//   const prisma = new PrismaClient({
//     datasourceUrl: DATABASE_URL,
//   }).$extends(withAccelerate());

//   try {
//     const res = await prisma.weektask.findMany({
//       where:{
//         user_id: userId
//       }
//     });
//     return c.json({
//       res: res,
//       success:true
//     });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return c.json({
//       res: error,
//       success:false
//     })
//   }finally{
//     prisma.$disconnect();
//   }
// });


app.post('/deleteweektask', authtoken, async (c:any) => {
  //const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const body = await c.req.json();
  //const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.weektask.delete({
      where:{
        id: body.id
      },
      select:{
        id:true,
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});



app.post('/savecode', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const body = await c.req.json();
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.codestore.create({
      data:{
        user_id: userId,
        code :body.code,
        description:body.description,
        title:body.title,
        language:body.language,
        important:false
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});
//authtoken
app.post('/getcode', async (c:any) => {
  //const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const body = await c.req.json();
  //const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.codestore.findFirst({
      where:{
        id:body.id,
        // user_id:userId
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});



app.post('/getallcode', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); 
  const body = await c.req.json();
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.codestore.findMany({
      where:{
        user_id:userId
      },
      select:{
        id:true,
        title:true,
        description:true,
        important:true,
        created_at:true,
        language:true,
        user_id:true
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});




app.post('/deletecode', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const body = await c.req.json();
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.codestore.delete({
      where:{
        id:body.id,
        user_id:userId
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});


app.post('/updatecode', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const body = await c.req.json();
  const userId = x.id;

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.codestore.update({
      where:{
        id:body.id,
        user_id:userId
      },
      data:{
        code :body.code,
        description:body.description,
        title:body.title,
        language:body.language
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});

app.post('/updatecodeimportant', authtoken, async (c:any) => {
  const x = await c.get('userinfo'); // Assuming this retrieves user info 
  const body = await c.req.json();
  const userId = x.id;
  console.log(body);

  const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
  const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const res = await prisma.codestore.update({
      where:{
        id:body.id,
        user_id:userId
      },
      data:{
        important:body.important
      },select:{
        id:true,
        title:true,
        description:true,
        important:true,
        created_at:true,
        language:true,
        user_id:true
      }
    });
    return c.json({
      res: res,
      success:true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      res: error,
      success:false
    })
  }finally{
    prisma.$disconnect();
  }
});





export default app;




