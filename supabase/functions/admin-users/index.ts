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
 const {data:profile,error:profileErr}=await userClient.from("profiles").select("role,email").eq("id",auth.user.id).maybeSingle();
 if(profileErr||profile?.role!=="admin")return reply({error:"Admin access required"},403,origin);
 let body:{action?:unknown;userId?:unknown;role?:unknown};
 try{body=await req.json();}catch{return reply({error:"Invalid JSON"},400,origin);}
 if(body.action!=="set-role"||typeof body.userId!=="string"||!["admin","partner"].includes(String(body.role)))return reply({error:"Invalid request"},400,origin);
 if(body.userId===auth.user.id)return reply({error:"You cannot change your own role"},400,origin);
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:target,error:targetErr}=await admin.from("profiles").select("id,email,role").eq("id",body.userId).maybeSingle();
 if(targetErr||!target)return reply({error:"Member not found"},404,origin);
 if(target.role==="admin"&&body.role==="partner"){
   const {count,error:countErr}=await admin.from("profiles").select("id",{count:"exact",head:true}).eq("role","admin");
   if(countErr)return reply({error:"Could not verify administrator count"},500,origin);
   if((count??0)<=1)return reply({error:"At least one administrator must remain"},409,origin);
 }
 const nextRole=body.role as "admin"|"partner";
 const {error:updateErr}=await admin.from("profiles").update({role:nextRole}).eq("id",body.userId);
 if(updateErr)return reply({error:"Could not update member role"},500,origin);
 const {error:allowErr}=await admin.from("app_allowlist").upsert({email:target.email.toLowerCase(),role:nextRole},{onConflict:"email"});
 if(allowErr){await admin.from("profiles").update({role:target.role}).eq("id",body.userId);return reply({error:"Could not synchronize allowlist; role change rolled back"},500,origin);}
 const {error:auditErr}=await admin.from("admin_audit_logs").insert({actor_id:auth.user.id,action:"users.role.updated",target_id:body.userId,details:{from:target.role,to:nextRole}});
 if(auditErr)console.error("Audit insert failed",auditErr.code??"unknown");
 return reply({ok:true},200,origin);
});