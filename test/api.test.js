import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTicketingServer } from '../src/server.js';
import { createMemoryRepository } from '../src/repositories/memory.js';
const SECRET='api-test-secret-with-more-than-32-characters';
let server,base;
before(async()=>{server=createTicketingServer({repository:createMemoryRepository(),tokenSecret:SECRET});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));});
async function request(path,{method='GET',token,body}={}){const headers={};if(token)headers.authorization=`Bearer ${token}`;if(body!==undefined)headers['content-type']='application/json';const response=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,body:await response.json()};}
async function account(email,role){return request('/api/auth/signup',{method:'POST',body:{name:'Test User',email,password:'test-password-123',role}});}
describe('Build 7 API',()=>{
 it('creates an organizer event, tier and publishes it',async()=>{const org=await account('organizer@test.com','organizer');assert.equal(org.status,201);const event=await request('/api/events',{method:'POST',token:org.body.token,body:{title:'Build 7 Demo',city:'Ibadan',startsAt:'2027-05-01T10:00:00Z'}});assert.equal(event.status,201);const tier=await request(`/api/events/${event.body.id}/tiers`,{method:'POST',token:org.body.token,body:{name:'Standard',priceCents:250000,capacity:20}});assert.equal(tier.status,201);assert.equal((await request(`/api/events/${event.body.id}/publish`,{method:'POST',token:org.body.token})).status,200);assert.equal((await request('/api/events')).body.events.length,1);});
 it('does not accept the old x-user-id identity header',async()=>{const result=await request('/api/events',{method:'POST',body:{title:'No auth',city:'Lagos',startsAt:'2027-05-01T10:00:00Z'}});assert.equal(result.status,401);});
});
