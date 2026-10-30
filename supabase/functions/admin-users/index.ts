import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const origins=new Set(["https://money-tracking.kajonsak6210035.workers.dev","http://localhost:5173","http://127.0.0.1:5173"]);
function reply(body:unknown,status:number,origin:string|null){const h=new Headers({"Content-Type":"application/json; charset=utf-8","Vary":"Origin"});if(origin&&origins.has(origin)){h.set("Access-Control-Allow-Origin",origin);h.set("Access-Control-Allow-Headers","authorization, x-client-info, apikey, content-type");h.set("Access-Control-Allow-Methods","POST, OPTIONS");}return new Response(JSON.stringify(body),{status,headers:h});}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin");
 if(req.method==="OPTIONS")return reply({ok:true},200,origin);
 if(req.method!=="POST")return reply({error:"Method not allowed"},405,origin);
 if(origin&&!origins.has(origin))return reply({error:"Origin not allowed"},403,origin);
 const token=req.headers.get("Authorization")?.replace(/^Bearer\s+/i,"");
 if(!token)return reply({error:"Authentication required"},401,origin);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!service)return reply({error:"Server configuration incomplete"},503,origin);
 const userClient=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:auth,error:authErr}=await userClient.auth.getUser(token);
 if(authErr||!auth.user)return reply({error:"Invalid session"},401,origin);
 const {data:profile,error:profileErr}=await userClient.from("profiles").select("role").eq("id",auth.user.id).maybeSingle();
 if(profileErr||profile?.role!=="admin")return reply({error:"Admin access required"},403,origin);
 let body:{action?:unknown;userId?:unknown;role?:unknown};
 try{body=await req.json();}catch{return reply({error:"Invalid JSON"},400,origin);}
 if(body.action!=="set-role"||typeof body.userId!=="string"||!["admin","partner"].includes(String(body.role)))return reply({error:"Invalid request"},400,origin);
 if(body.userId===auth.user.id)return reply({error:"You cannot change your own role"},400,origin);
 const serviceClient=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error}=await serviceClient.rpc("admin_update_user_role",{p_target_id:body.userId,p_new_role:body.role,p_actor_id:auth.user.id});
 if(error){
   if(error.code==="P0002")return reply({error:"Member not found"},404,origin);
   if(error.code==="23514")return reply({error:"At least one administrator must remain"},409,origin);
   if(error.code==="22023")return reply({error:"Invalid role change"},400,origin);
   console.error("Role update failed",error.code??"unknown");
   return reply({error:"Could not update member role"},500,origin);
 }
 return reply({ok:true},200,origin);
});