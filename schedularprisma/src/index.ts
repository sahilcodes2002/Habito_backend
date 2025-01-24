import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import {env} from 'hono/adapter'
import { cors } from 'hono/cors';
import z from 'zod'
//import { FetchEvent, Response, ScheduledEvent } from '@cloudflare/workers-types';

//import { notesauth } from './middlewares/notesauth';


const app = new Hono();
app.use(cors());






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

export default {
  async scheduled(event:any, env:any, ctx:any) {
    //console.log(event.scheduledTime)
    await handleScheduled();
  },
}


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






