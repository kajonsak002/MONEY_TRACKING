import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Wallet } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
type Entry={id:string;user_id:string;type:"income"|"expense";amount_satang:number;note:string|null;occurred_on:string;created_at:string};
type Profile={id:string;email:string;display_name:string|null};
export function AdminTransactionsPage(){
 const { configured } = useAuth();
 const [search,setSearch]=useState("");const [type,setType]=useState("all");
 const profiles=useQuery({queryKey:["admin","transaction-profiles"],enabled:configured,queryFn:async()=>{if(!supabase)throw new Error("ยังไม่ได้ตั้งค่า Supabase");const {data,error}=await supabase.from("profiles").select("id,email,display_name");if(error)throw error;return (data??[]) as Profile[]}});
 const entries=useQuery({queryKey:["admin","transactions"],enabled:!!supabase,queryFn:async()=>{if(!supabase)throw new Error("ยังไม่ได้ตั้งค่า Supabase");const {data,error}=await supabase.from("entries").select("id,user_id,type,amount_satang,note,occurred_on,created_at").is("deleted_at",null).order("occurred_on",{ascending:false}).limit(1000);if(error)throw error;return (data??[]) as Entry[]}});
 const byId=useMemo(()=>new Map((profiles.data??[]).map(p=>[p.id,p])),[profiles.data]);
 const filtered=useMemo(()=> (entries.data??[]).filter(e=>(type==="all"||e.type===type)&&[e.note??"",byId.get(e.user_id)?.email??"",byId.get(e.user_id)?.display_name??""].some(v=>v.toLowerCase().includes(search.toLowerCase()))),[entries.data,byId,type,search]);
 const money=(v:number)=>new Intl.NumberFormat("th-TH",{style:"currency",currency:"THB"}).format(v/100);
 return <div className="admin-list-page"><header className="admin-heading"><div><span className="admin-eyebrow">MANAGEMENT / TRANSACTIONS</span><h1>รายการทั้งหมด</h1><p>ดูข้อมูลการเงินที่สมาชิกบันทึก โดย Admin ไม่มีสิทธิ์แก้ไขรายการแทนเจ้าของ</p></div><span className="admin-list-count"><Wallet size={15}/>{entries.data?.length??0} รายการ</span></header>
 <section className="admin-panel"><div className="admin-filter-row"><label className="admin-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาหมายเหตุหรือสมาชิก"/></label><select value={type} onChange={e=>setType(e.target.value)}><option value="all">ทุกประเภท</option><option value="income">รายรับ</option><option value="expense">รายจ่าย</option></select></div>
 {!configured?<div className="admin-empty" role="alert">ยังไม่ได้ตั้งค่า Supabase</div>:entries.isLoading||profiles.isLoading?<div className="admin-empty" role="status">กำลังโหลดรายการ...</div>:entries.isError||profiles.isError?<div className="admin-empty" role="alert">{entries.error?.message??profiles.error?.message}</div>:!filtered.length?<div className="admin-empty">ไม่พบรายการ</div>:<div className="admin-table-scroll"><table className="admin-member-table admin-transactions-table"><thead><tr><th>วันที่</th><th>สมาชิก</th><th>รายละเอียด</th><th>ประเภท</th><th>จำนวนเงิน</th></tr></thead><tbody>{filtered.map(e=><tr key={e.id}><td>{e.occurred_on}</td><td>{byId.get(e.user_id)?.display_name||byId.get(e.user_id)?.email||"สมาชิก"}</td><td>{e.note||"—"}</td><td><span className={e.type==="income"?"admin-role admin":"admin-role partner"}>{e.type==="income"?"รายรับ":"รายจ่าย"}</span></td><td className="admin-amount-cell">{money(Number(e.amount_satang))}</td></tr>)}</tbody></table></div>}</section></div>;
}