const json=(schema)=>({content:{'application/json':{schema}}});
const ref=(name)=>({$ref:`#/components/schemas/${name}`});
const auth=[{BearerAuth:[]}];const publicAccess=[{}];
const idParam={name:'id',in:'path',required:true,schema:{type:'string'}};
const bookingParam={name:'reference',in:'path',required:true,schema:{type:'string'}};
const error= (description)=>({description,...json(ref('Error'))});
export const openApiDocument={
 openapi:'3.1.0',info:{title:'Event Ticketing API',version:'0.7.0',description:'Build 7 API. Create accounts, sign in with a signed bearer token, organize events, and book tickets. Passwords are stored as scrypt hashes; never send raw card details.'},servers:[{url:'/'}],
 paths:{
  '/health':{get:{summary:'Health check',security:publicAccess,responses:{200:{description:'OK'}}}},
  '/api/auth/signup':{post:{summary:'Create an attendee or organizer account',security:publicAccess,requestBody:{required:true,...json({type:'object',required:['name','email','password'],properties:{name:{type:'string'},email:{type:'string',format:'email'},password:{type:'string',minLength:8},role:{type:'string',enum:['attendee','organizer','staff']},staffInviteCode:{type:'string',description:'Required only for staff signup when STAFF_SIGNUP_KEY is configured'}}})},responses:{201:{description:'Account and signed token returned'},400:error('Invalid input'),409:error('Email already registered')}}},
  '/api/auth/login':{post:{summary:'Log in',security:publicAccess,requestBody:{required:true,...json({type:'object',required:['email','password'],properties:{email:{type:'string'},password:{type:'string'}}})},responses:{200:{description:'Signed token returned'},401:error('Invalid credentials')}}},
  '/api/auth/me':{get:{summary:'Current account',security:auth,responses:{200:{description:'Current user'},401:error('Unauthenticated')}}},
  '/api/events':{get:{summary:'Search published events',security:publicAccess,responses:{200:{description:'Events'}}},post:{summary:'Create a draft event (organizer)',security:auth,responses:{201:{description:'Event created'},401:error('Unauthenticated'),403:error('Wrong role')}}},
  '/api/events/{id}':{get:{summary:'View event',security:publicAccess,parameters:[idParam],responses:{200:{description:'Event details'},404:error('Not found')}}},
  '/api/events/{id}/tiers':{post:{summary:'Add ticket tier (event owner)',security:auth,parameters:[idParam],responses:{201:{description:'Tier added'},403:error('Not owner')}}},
  '/api/events/{id}/publish':{post:{summary:'Publish event (owner)',security:auth,parameters:[idParam],responses:{200:{description:'Published'},403:error('Not owner')}}},
  '/api/events/{id}/unpublish':{post:{summary:'Unpublish event (owner)',security:auth,parameters:[idParam],responses:{200:{description:'Unpublished'},403:error('Not owner')}}},
  '/api/bookings':{get:{summary:'List my bookings (attendee)',security:auth,responses:{200:{description:'Current attendee bookings'}}},post:{summary:'Book tickets (attendee)',security:auth,responses:{201:{description:'Booking created'}}}},
  '/api/bookings/{reference}':{get:{summary:'View my booking',security:auth,parameters:[bookingParam],responses:{200:{description:'Booking'},404:error('Not found')}}},
  '/api/bookings/{reference}/pay':{post:{summary:'Pay using a mock payment token',security:auth,parameters:[bookingParam],responses:{200:{description:'Paid'},402:error('Payment declined')}}},
  '/api/bookings/{reference}/cancel':{post:{summary:'Cancel an unpaid booking',security:auth,parameters:[bookingParam],responses:{200:{description:'Cancelled'}}}},
 },
 components:{securitySchemes:{BearerAuth:{type:'http',scheme:'bearer',bearerFormat:'JWT'}},schemas:{Error:{type:'object',properties:{error:{type:'object',properties:{code:{type:'string'},message:{type:'string'}}}}}}}
};
