import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './ChatPage.module.css';
import { api } from './lib/api.js';

const time = value => value ? new Date(value).toLocaleString('en-NG') : '—';

export default function ChatPage({ user = {}, onBack=()=>{}, onNavigate=()=>{} }) {
  const [conversations,setConversations]=useState([]);
  const [selectedId,setSelectedId]=useState('');
  const [messages,setMessages]=useState([]);
  const [search,setSearch]=useState('');
  const [draft,setDraft]=useState('');
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');
  const [file,setFile]=useState(null);
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);

  const loadConversations=useCallback(async()=>{
    const rows=await api.get('/conversations');
    const list=Array.isArray(rows)?rows:rows?.items||[];
    setConversations(list);
    if(!selectedId&&list.length)setSelectedId(list[0].pid);
    return list;
  },[selectedId]);

  const loadMessages=useCallback(async pid=>{
    if(!pid)return;
    const [rows]=await Promise.all([
      api.get('/conversations/'+encodeURIComponent(pid)+'/messages?limit=50'),
      api.post('/conversations/'+encodeURIComponent(pid)+'/read',{}),
    ]);
    setMessages(Array.isArray(rows)?rows:rows?.items||[]);
    setConversations(prev=>prev.map(item=>item.pid===pid?{...item,unread_count:0}:item));
  },[]);

  useEffect(()=>{
    let active=true;
    setLoading(true);
    api.get('/conversations').then(rows=>{
      if(!active)return;
      const list=Array.isArray(rows)?rows:rows?.items||[];
      setConversations(list);
      setSelectedId(current=>current||list[0]?.pid||'');
    }).catch(err=>{if(active)setError(err?.message||'Your conversations could not be loaded.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);

  useEffect(()=>{
    if(!selectedId)return;
    let active=true;
    api.get('/conversations/'+encodeURIComponent(selectedId)+'/messages?limit=50')
      .then(rows=>{if(active)setMessages(Array.isArray(rows)?rows:rows?.items||[]);})
      .then(()=>api.post('/conversations/'+encodeURIComponent(selectedId)+'/read',{}))
      .then(()=>{if(active)setConversations(prev=>prev.map(item=>item.pid===selectedId?{...item,unread_count:0}:item));})
      .catch(err=>{if(active)setError(err?.message||'Messages could not be loaded.');});
    return()=>{active=false;};
  },[selectedId]);

  const selected=conversations.find(item=>item.pid===selectedId)||null;
  const visible=useMemo(()=>conversations.filter(item=>(item.other_user_name+' '+(item.ref_pid||'')+' '+(item.last_message?.body||'')).toLowerCase().includes(search.toLowerCase())),[conversations,search]);

  const send=async()=>{
    if(sending||(!draft.trim()&&!file))return;
    if(!selected){setError('Select an existing conversation before sending a message.');return;}
    setSending(true);setError('');setNotice('');
    try{
      let attachmentKey;
      if(file){
        const form=new FormData();form.append('file',file);
        const uploaded=await api.upload('/conversations/'+encodeURIComponent(selected.pid)+'/attachments',form);
        attachmentKey=uploaded?.attachment_key;
      }
      const sent=await api.post('/conversations/'+encodeURIComponent(selected.pid)+'/messages',{body:draft.trim(),attachment_key:attachmentKey});
      setMessages(prev=>[...prev,sent]);
      setDraft('');setFile(null);
      setNotice('Message sent to KHUB. Refresh the thread to retrieve the latest replies.');
      await loadConversations();
    }catch(err){setError(err?.message||'Message could not be sent.');}
    finally{setSending(false);}
  };

  return <div className={styles.page}>
    <div style={{marginBottom:18}}><button type="button" onClick={onBack} aria-label="Go back" style={{display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #dce8df',background:'#fff',color:'#176b43',borderRadius:999,padding:'10px 16px',fontWeight:700,cursor:'pointer'}}>← Back</button></div>
    <header className={styles.heading}><h1>Good work starts with a conversation.</h1><p>09 Personal hub / Chat inbox and conversation<br/>Your inbox · {conversations.reduce((sum,item)=>sum+Number(item.unread_count||0),0)} unread · Live KHUB conversations.</p></header>
    <div className={styles.layout}>
      <aside className={styles.inbox}><h2>Inbox</h2><label className={styles.search}><span>Search conversations</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search names or references"/></label>
        <div className={styles.conversationList}>{visible.map(item=><button key={item.pid} className={`${styles.conversation} ${selectedId===item.pid?styles.selected:''}`} onClick={()=>{setSelectedId(item.pid);setNotice('');setError('');}}><strong>{Number(item.unread_count)>0?'◉ ':''}{item.other_user_name}{Number(item.unread_count)>0?' · '+item.unread_count+' unread':''}</strong><span>{item.last_message?.body||'No messages yet'} · {time(item.last_message?.created_at||item.created_at)}</span>{selectedId===item.pid&&<small>✓ Selected · {item.ref_pid||item.pid}</small>}</button>)}</div>
        {loading&&<p>Loading conversations…</p>}{!loading&&visible.length===0&&<p>No conversations found. Start a conversation from a member or listing contact action.</p>}
        <button className={styles.link} onClick={loadConversations}>Refresh inbox</button>
      </aside>
      <main className={styles.thread}>
        {selected?<><h2>{selected.other_user_name}</h2><p className={styles.meta}>KHUB member · Conversation protected by participant permissions</p><p>{selected.ref_table&&selected.ref_pid?'Related to '+selected.ref_table+' · '+selected.ref_pid:'General conversation'}</p>
          <div className={styles.date}>Conversation messages</div>
          <div className={styles.messages}>{messages.map(message=><div key={message.pid||message.id} className={`${styles.message} ${message.sender_pid===user.pid?styles.mine:styles.theirs}`}><p>{message.body}</p>{message.attachment_url&&<a href={message.attachment_url} target="_blank" rel="noreferrer">Open attachment</a>}<small>{message.sender_pid===user.pid?'You':selected.other_user_name} · {time(message.created_at)}</small></div>)}</div>
          <label className={styles.composer}><span>Message {selected.other_user_name}</span><textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Write a message..." rows={2}/></label>
          <div className={styles.actions}><label className={styles.link} htmlFor="chat-file">Attach a file</label><input id="chat-file" className={styles.fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setFile(e.target.files?.[0]||null)}/>{file&&<span className={styles.fileName}>{file.name}</span>}<button className={styles.primary} disabled={sending||(!draft.trim()&&!file)} onClick={send}>{sending?'Sending…':'Send message'}</button><button className={styles.link} onClick={()=>loadMessages(selected.pid)}>Refresh thread</button></div>
        </>:<div className={styles.notice}>Select a conversation to view messages. Contact a listing owner to start a new conversation.</div>}
        <p className={styles.footer}>Messages are stored by KHUB. Never send passwords, OTPs, card PINs or bank login details in chat.</p>
        {error&&<div className={styles.notice} role="alert">{error}</div>}{notice&&<div className={styles.notice} role="status">{notice}</div>}
      </main>
    </div>
    <button className={styles.back} onClick={onBack}>Back to dashboard</button>
  </div>;
}
