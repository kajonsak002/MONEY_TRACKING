import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Users, ShieldCheck, UserPlus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

type Member = { id:string; email:string; display_name:string|null; role:"admin"|"partner"; created_at:string };
export function AdminUsersPage() {
  const { user } = useAuth();
  const client=useQueryClient();
  const [search,setSearch]=useState("");
  const [role,setRole]=useState("all");
  const [newEmail,setNewEmail]=useState("");
  const [newRole,setNewRole]=useState<"admin"|"partner">("partner");
  const query=useQuery({queryKey:["admin","users"],enabled:!!supabase,queryFn:async()=>{
    if(!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
    const {data,error}=await supabase.from("profiles").select("id,email,display_name,role,created_at").order("created_at",{ascending:false}).limit(1000);
    if(error) throw error;
    return (data??[]) as Member[];
  }});
  const filtered=useMemo(()=> (query.data??[]).filter(m=>(role==="all"||m.role===role)&&[m.email,m.display_name??""].some(v=>v.toLowerCase().includes(search.toLowerCase()))),[query.data,role,search]);
  const counts={admin:(query.data??[]).filter(m=>m.role==="admin").length,partner:(query.data??[]).filter(m=>m.role==="partner").length};
  const addAllowed=useMutation({mutationFn:async()=>{
    if(!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
    const {data,error}=await supabase.functions.invoke("admin-users",{body:{action:"allowlist",email:newEmail.trim(),role:newRole}});
    if(error||data?.error) throw new Error(data?.error??error?.message??"เพิ่มอีเมลไม่สำเร็จ");
  },onSuccess:()=>{setNewEmail("");void client.invalidateQueries({queryKey:["admin","users"]});}});
  const changeRole=useMutation({mutationFn:async({member,nextRole}:{member:Member;nextRole:"admin"|"partner"})=>{
    if(!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
    if(member.id===user?.id) throw new Error("ไม่สามารถเปลี่ยนสิทธิ์บัญชีตัวเองได้");
    if(!window.confirm("ยืนยันเปลี่ยนสิทธิ์ของ "+member.email+" เป็น "+nextRole+" หรือไม่?")) throw new Error("ยกเลิกการเปลี่ยนสิทธิ์");
    const {data,error}=await supabase.functions.invoke("admin-users",{body:{action:"set-role",userId:member.id,role:nextRole}});
    if(error||data?.error) throw new Error(data?.error??error?.message??"เปลี่ยนสิทธิ์ไม่สำเร็จ");
  },onSuccess:()=>{void client.invalidateQueries({queryKey:["admin","users"]});void client.invalidateQueries({queryKey:["admin","profiles"]});}});
  return <div className="admin-list-page">
    <header className="admin-heading"><div><span className="admin-eyebrow">MANAGEMENT / MEMBERS</span><h1>ผู้ใช้งาน</h1><p>ตรวจสอบบัญชีและจัดการระดับสิทธิ์ผ่าน Backend ที่ตรวจสอบ Admin</p></div><span className="admin-list-count"><Users size={15}/>{query.data?.length??0} บัญชี</span></header>
    <section className="admin-panel admin-allowlist-panel">
      <div className="admin-panel-head"><h2><UserPlus size={17}/> เพิ่มผู้ใช้ที่ได้รับอนุญาต</h2></div>
      <p className="admin-setting-description">เพิ่มอีเมลก่อนให้ผู้ใช้เข้าสู่ระบบด้วย Google บัญชีจะปรากฏในรายชื่อหลังเข้าสู่ระบบครั้งแรก</p>
      <form className="admin-allowlist-form" onSubmit={event=>{event.preventDefault();addAllowed.mutate();}}>
        <input type="email" required maxLength={254} value={newEmail} onChange={event=>setNewEmail(event.target.value)} placeholder="name@example.com" aria-label="อีเมลผู้ใช้ใหม่"/>
        <select value={newRole} onChange={event=>setNewRole(event.target.value as "admin"|"partner")} aria-label="สิทธิ์ผู้ใช้ใหม่"><option value="partner">Partner</option><option value="admin">Admin</option></select>
        <button className="admin-primary-button" type="submit" disabled={addAllowed.isPending||!newEmail.trim()}>{addAllowed.isPending?"กำลังบันทึก...":"เพิ่มอีเมล"}</button>
      </form>
      {addAllowed.isError&&<p className="entry-error" role="alert">{addAllowed.error.message}</p>}
      {addAllowed.isSuccess&&<p className="admin-notice" role="status">เพิ่มอีเมลใน Allowlist แล้ว</p>}
    </section>
    <div className="admin-user-stats"><article><small>ผู้ดูแลระบบ</small><strong>{counts.admin}</strong></article><article><small>Partner</small><strong>{counts.partner}</strong></article></div>
    <section className="admin-panel"><div className="admin-filter-row"><label className="admin-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อหรืออีเมล"/></label><select value={role} onChange={e=>setRole(e.target.value)}><option value="all">ทุกสิทธิ์</option><option value="admin">Admin</option><option value="partner">Partner</option></select></div>
    {query.isLoading?<div className="admin-empty">กำลังโหลดสมาชิก...</div>:query.isError?<div className="admin-empty">{query.error.message}</div>:!filtered.length?<div className="admin-empty">ไม่พบสมาชิก</div>:
    <div className="admin-table-scroll"><table className="admin-member-table"><thead><tr><th>สมาชิก</th><th>สิทธิ์</th><th>วันที่สมัคร</th><th>จัดการ</th></tr></thead><tbody>{filtered.map(m=><tr key={m.id}><td><strong>{m.display_name||"ไม่ระบุชื่อ"}</strong><br/><span>{m.email}</span></td><td><span className={m.role==="admin"?"admin-role admin":"admin-role partner"}>{m.role}</span></td><td>{new Intl.DateTimeFormat("th-TH",{dateStyle:"medium"}).format(new Date(m.created_at))}</td><td>{m.id===user?.id?<span className="admin-self-label">บัญชีปัจจุบัน</span>:<select aria-label={"เปลี่ยนสิทธิ์ "+m.email} value={m.role} disabled={changeRole.isPending} onChange={e=>changeRole.mutate({member:m,nextRole:e.target.value as "admin"|"partner"})}><option value="partner">Partner</option><option value="admin">Admin</option></select>}</td></tr>)}</tbody></table></div>}
    {changeRole.isError&&<p className="entry-error" role="alert">{changeRole.error.message}</p>}
    </section>
    <p className="admin-page-footnote"><ShieldCheck size={14}/> การเปลี่ยนสิทธิ์จะอัปเดต allowlist และโปรไฟล์ผ่าน Edge Function เท่านั้น ไม่เปิดสิทธิ์แก้ไขตาราง allowlist จาก Browser</p>
  </div>;
}