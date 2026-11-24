import * as api from '../api.js';
import { saveSession } from '../session.js';
const returnTo=new URLSearchParams(location.search).get('returnTo')||'/';
function go(user){location.href=user.role==='organizer'?'/organizer':returnTo;}
const login=document.querySelector('#login-form');login.addEventListener('submit',async e=>{e.preventDefault();const status=document.querySelector('#login-status');const button=login.querySelector('button');button.disabled=true;status.textContent='Signing in…';try{const result=await api.login(Object.fromEntries(new FormData(login)));saveSession(result);go(result.user);}catch(error){status.textContent=error.message;button.disabled=false;}});
const signup=document.querySelector('#signup-form');signup.addEventListener('submit',async e=>{e.preventDefault();const status=document.querySelector('#signup-status');const button=signup.querySelector('button');button.disabled=true;status.textContent='Creating account…';try{const result=await api.signup(Object.fromEntries(new FormData(signup)));saveSession(result);go(result.user);}catch(error){status.textContent=error.message;button.disabled=false;}});
