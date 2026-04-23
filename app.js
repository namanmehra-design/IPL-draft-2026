import{initializeApp}from"https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import{getDatabase,ref,set,onValue,update,push,get,remove}from"https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import{getAI,getGenerativeModel,GoogleAIBackend}from"https://www.gstatic.com/firebasejs/12.3.0/firebase-ai.js";
import{getAuth,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,onAuthStateChanged,signOut,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult}from"https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const cfg={apiKey:"AIzaSyBIHdz4Vu1kMlEjwXs-dcDwFeHGhjSSb3I",authDomain:"ipl-2026-draft.firebaseapp.com",databaseURL:"https://ipl-2026-draft-default-rtdb.firebaseio.com",projectId:"ipl-2026-draft",storageBucket:"ipl-2026-draft.firebasestorage.app",messagingSenderId:"5757407923",appId:"1:5757407923:web:6afc487aed6cf15fb516c6"};
const app=initializeApp(cfg),db=getDatabase(app),auth=getAuth(app),gp=new GoogleAuthProvider();
// Firebase AI Logic -- lazy init so a missing console setup never blocks auth
let _geminiModel=null;
function getGeminiModel(){
 if(_geminiModel) return _geminiModel;
 try{
 const ai=getAI(app,{backend:new GoogleAIBackend()});
 _geminiModel=getGenerativeModel(ai,{model:"gemini-2.5-flash"});
 return _geminiModel;
 }catch(e){
 throw new Error("Firebase AI Logic not set up yet. Enable it in your Firebase Console -> Build -> AI Logic, then reload.");
 }
}

// Connection dot
onValue(ref(db,'.info/connected'),s=>{
 const d=document.getElementById('connDot');if(!d)return;
 d.className=s.val()?'conn-dot live':'conn-dot dead';
 d.title=s.val()?'Live':'Reconnecting...';
});

// -- Team Color Shift --
const IPL_TEAM_COLORS = {
  CSK:'#FAED24', MI:'#00528A', KKR:'#602F92', RCB:'#D5282D',
  PBKS:'#D52027', GT:'#1B2A4A', RR:'#ED1164', SRH:'#F04F23',
  LSG:'#AB1D3F', DC:'#243D88'
};

function setTeamColorWash(iplTeam) {
  const wash = document.getElementById('auroraTeamWash');
  if (!wash) return;
  const color = iplTeam ? (IPL_TEAM_COLORS[iplTeam.toUpperCase()] || IPL_TEAM_COLORS[iplTeam]) : null;
  if (color) {
    wash.style.setProperty('--team-color', color);
    wash.classList.add('active');
  } else {
    wash.classList.remove('active');
  }
}

function clearTeamColorWash() {
  const wash = document.getElementById('auroraTeamWash');
  if (wash) wash.classList.remove('active');
}

// -- 250 Players --
const RAW=[
{n:"Ruturaj Gaikwad",t:"CSK",r:"Batter",o:false},{n:"MS Dhoni",t:"CSK",r:"Wicketkeeper",o:false},{n:"Dewald Brevis",t:"CSK",r:"Batter",o:true},{n:"Ayush Mhatre",t:"CSK",r:"Batter",o:false},{n:"Urvil Patel",t:"CSK",r:"Wicketkeeper",o:false},{n:"Shivam Dube",t:"CSK",r:"All-Rounder",o:false},{n:"Jamie Overton",t:"CSK",r:"All-Rounder",o:true},{n:"Ramakrishna Ghosh",t:"CSK",r:"Bowler",o:false},{n:"Noor Ahmad",t:"CSK",r:"Bowler",o:true},{n:"Khaleel Ahmed",t:"CSK",r:"Bowler",o:false},{n:"Anshul Kamboj",t:"CSK",r:"All-Rounder",o:false},{n:"Gurjapneet Singh",t:"CSK",r:"Bowler",o:false},{n:"Nathan Ellis",t:"CSK",r:"Bowler",o:true},{n:"Shreyas Gopal",t:"CSK",r:"Bowler",o:false},{n:"Mukesh Choudhary",t:"CSK",r:"Bowler",o:false},{n:"Sanju Samson",t:"CSK",r:"Wicketkeeper",o:false},{n:"Akeal Hosein",t:"CSK",r:"Bowler",o:true},{n:"Prashant Veer",t:"CSK",r:"All-Rounder",o:false},{n:"Kartik Sharma",t:"CSK",r:"Batter",o:false},{n:"Matthew Short",t:"CSK",r:"All-Rounder",o:true},{n:"Aman Khan",t:"CSK",r:"All-Rounder",o:false},{n:"Sarfaraz Khan",t:"CSK",r:"Batter",o:false},{n:"Matt Henry",t:"CSK",r:"Bowler",o:true},{n:"Rahul Chahar",t:"CSK",r:"Bowler",o:false},{n:"Zak Foulkes",t:"CSK",r:"All-Rounder",o:true},{n:"Spencer Johnson* (AUS)",t:"CSK",r:"Bowler",o:true},
{n:"Rohit Sharma",t:"MI",r:"Batter",o:false},{n:"Suryakumar Yadav",t:"MI",r:"Batter",o:false},{n:"Tilak Varma",t:"MI",r:"Batter",o:false},{n:"Robin Minz",t:"MI",r:"Wicketkeeper",o:false},{n:"Ryan Rickelton",t:"MI",r:"Wicketkeeper",o:true},{n:"Hardik Pandya",t:"MI",r:"All-Rounder",o:false},{n:"Naman Dhir",t:"MI",r:"All-Rounder",o:false},{n:"Mitchell Santner",t:"MI",r:"All-Rounder",o:true},{n:"Will Jacks",t:"MI",r:"All-Rounder",o:true},{n:"Corbin Bosch",t:"MI",r:"All-Rounder",o:true},{n:"Raj Bawa",t:"MI",r:"All-Rounder",o:false},{n:"Trent Boult",t:"MI",r:"Bowler",o:true},{n:"Jasprit Bumrah",t:"MI",r:"Bowler",o:false},{n:"Deepak Chahar",t:"MI",r:"Bowler",o:false},{n:"Ashwani Kumar",t:"MI",r:"Bowler",o:false},{n:"Raghu Sharma",t:"MI",r:"Bowler",o:false},{n:"AM Ghazanfar",t:"MI",r:"Bowler",o:true},{n:"Shardul Thakur",t:"MI",r:"All-Rounder",o:false},{n:"Sherfane Rutherford",t:"MI",r:"Batter",o:true},{n:"Mayank Markande",t:"MI",r:"Bowler",o:false},{n:"Quinton de Kock",t:"MI",r:"Wicketkeeper",o:true},{n:"Danish Malewar",t:"MI",r:"Batter",o:false},{n:"Mohammad Izhar",t:"MI",r:"Batter",o:false},{n:"Atharva Ankolekar",t:"MI",r:"All-Rounder",o:false},{n:"Mayank Rawat",t:"MI",r:"All-Rounder",o:false},{n:"Krish Bhagat",t:"MI",r:"Bowler",o:false},
{n:"Ajinkya Rahane",t:"KKR",r:"Batter",o:false},{n:"Rinku Singh",t:"KKR",r:"Batter",o:false},{n:"Angkrish Raghuvanshi",t:"KKR",r:"Batter",o:false},{n:"Manish Pandey",t:"KKR",r:"Batter",o:false},{n:"Rovman Powell",t:"KKR",r:"Batter",o:true},{n:"Anukul Roy",t:"KKR",r:"All-Rounder",o:false},{n:"Ramandeep Singh",t:"KKR",r:"All-Rounder",o:false},{n:"Vaibhav Arora",t:"KKR",r:"Bowler",o:false},{n:"Sunil Narine",t:"KKR",r:"All-Rounder",o:true},{n:"Varun Chakravarthy",t:"KKR",r:"Bowler",o:false},{n:"Harshit Rana",t:"KKR",r:"Bowler",o:false},{n:"Umran Malik",t:"KKR",r:"Bowler",o:false},{n:"Cameron Green",t:"KKR",r:"All-Rounder",o:true},{n:"Matheesha Pathirana",t:"KKR",r:"Bowler",o:true},{n:"Mustafizur Rahman",t:"KKR",r:"Bowler",o:true},{n:"Tejasvi Singh",t:"KKR",r:"Bowler",o:false},{n:"Rachin Ravindra",t:"KKR",r:"All-Rounder",o:true},{n:"Finn Allen",t:"KKR",r:"Batter",o:true},{n:"Tim Seifert",t:"KKR",r:"Wicketkeeper",o:true},{n:"Akash Deep",t:"KKR",r:"Bowler",o:false},{n:"Rahul Tripathi",t:"KKR",r:"Batter",o:false},{n:"Daksh Kamra",t:"KKR",r:"Bowler",o:false},{n:"Sarthak Ranjan",t:"KKR",r:"Batter",o:false},{n:"Prashant Solanki",t:"KKR",r:"Bowler",o:false},{n:"Kartik Tyagi",t:"KKR",r:"Bowler",o:false},{n:"Saurabh Dubey",t:"KKR",r:"Bowler",o:false},{n:"Navdeep Saini",t:"KKR",r:"Bowler",o:false},{n:"Blessing Muzarabani",t:"KKR",r:"Bowler",o:true},
{n:"Rajat Patidar",t:"RCB",r:"Batter",o:false},{n:"Virat Kohli",t:"RCB",r:"Batter",o:false},{n:"Devdutt Padikkal",t:"RCB",r:"Batter",o:false},{n:"Phil Salt",t:"RCB",r:"Wicketkeeper",o:true},{n:"Jitesh Sharma",t:"RCB",r:"Wicketkeeper",o:false},{n:"Krunal Pandya",t:"RCB",r:"All-Rounder",o:false},{n:"Swapnil Singh",t:"RCB",r:"All-Rounder",o:false},{n:"Tim David",t:"RCB",r:"Batter",o:true},{n:"Romario Shepherd",t:"RCB",r:"All-Rounder",o:true},{n:"Jacob Bethell",t:"RCB",r:"All-Rounder",o:true},{n:"Josh Hazlewood",t:"RCB",r:"Bowler",o:true},{n:"Yash Dayal",t:"RCB",r:"Bowler",o:false},{n:"Bhuvneshwar Kumar",t:"RCB",r:"Bowler",o:false},{n:"Nuwan Thushara",t:"RCB",r:"Bowler",o:true},{n:"Rasikh Salam",t:"RCB",r:"Bowler",o:false},{n:"Abhinandan Singh",t:"RCB",r:"Bowler",o:false},{n:"Suyash Sharma",t:"RCB",r:"Bowler",o:false},{n:"Venkatesh Iyer",t:"RCB",r:"All-Rounder",o:false},{n:"Jacob Duffy",t:"RCB",r:"Bowler",o:true},{n:"Satvik Deswal",t:"RCB",r:"All-Rounder",o:false},{n:"Mangesh Yadav",t:"RCB",r:"All-Rounder",o:false},{n:"Jordan Cox",t:"RCB",r:"Wicketkeeper",o:true},{n:"Vicky Ostwal",t:"RCB",r:"Bowler",o:false},{n:"Kanishk Chouhan",t:"RCB",r:"Batter",o:false},{n:"Vihaan Malhotra",t:"RCB",r:"Batter",o:false},
{n:"Shreyas Iyer",t:"PBKS",r:"Batter",o:false},{n:"Nehal Wadhera",t:"PBKS",r:"Batter",o:false},{n:"Priyansh Arya",t:"PBKS",r:"Batter",o:false},{n:"Prabhsimran Singh",t:"PBKS",r:"Wicketkeeper",o:false},{n:"Shashank Singh",t:"PBKS",r:"Batter",o:false},{n:"Pyla Avinash",t:"PBKS",r:"Batter",o:false},{n:"Harnoor Pannu",t:"PBKS",r:"Batter",o:false},{n:"Musheer Khan",t:"PBKS",r:"All-Rounder",o:false},{n:"Vishnu Vinod",t:"PBKS",r:"Wicketkeeper",o:false},{n:"Marcus Stoinis",t:"PBKS",r:"All-Rounder",o:true},{n:"Azmatullah Omarzai",t:"PBKS",r:"All-Rounder",o:true},{n:"Suryansh Shedge",t:"PBKS",r:"All-Rounder",o:false},{n:"Mitchell Owen",t:"PBKS",r:"All-Rounder",o:true},{n:"Arshdeep Singh",t:"PBKS",r:"Bowler",o:false},{n:"Vyshak Vijaykumar",t:"PBKS",r:"Bowler",o:false},{n:"Marco Jansen",t:"PBKS",r:"Bowler",o:true},{n:"Yash Thakur",t:"PBKS",r:"Bowler",o:false},{n:"Xavier Bartlett",t:"PBKS",r:"Bowler",o:true},{n:"Lockie Ferguson",t:"PBKS",r:"Bowler",o:true},{n:"Yuzvendra Chahal",t:"PBKS",r:"Bowler",o:false},{n:"Harpreet Brar",t:"PBKS",r:"All-Rounder",o:false},{n:"Ben Dwarshuis",t:"PBKS",r:"Bowler",o:true},{n:"Cooper Connolly",t:"PBKS",r:"All-Rounder",o:true},{n:"Pravin Dubey",t:"PBKS",r:"Bowler",o:false},{n:"Vishal Nishad",t:"PBKS",r:"Batter",o:false},
{n:"Shubman Gill",t:"GT",r:"Batter",o:false},{n:"Rashid Khan",t:"GT",r:"Bowler",o:true},{n:"Sai Sudharsan",t:"GT",r:"Batter",o:false},{n:"Rahul Tewatia",t:"GT",r:"All-Rounder",o:false},{n:"Shahrukh Khan",t:"GT",r:"All-Rounder",o:false},{n:"Kagiso Rabada",t:"GT",r:"Bowler",o:true},{n:"Jos Buttler",t:"GT",r:"Wicketkeeper",o:true},{n:"Mohammed Siraj",t:"GT",r:"Bowler",o:false},{n:"Prasidh Krishna",t:"GT",r:"Bowler",o:false},{n:"Nishant Sindhu",t:"GT",r:"All-Rounder",o:false},{n:"Kumar Kushagra",t:"GT",r:"Wicketkeeper",o:false},{n:"Anuj Rawat",t:"GT",r:"Wicketkeeper",o:false},{n:"Manav Suthar",t:"GT",r:"Bowler",o:false},{n:"Washington Sundar",t:"GT",r:"All-Rounder",o:false},{n:"Arshad Khan",t:"GT",r:"Bowler",o:false},{n:"Gurnoor Brar",t:"GT",r:"Bowler",o:false},{n:"Sai Kishore",t:"GT",r:"Bowler",o:false},{n:"Ishant Sharma",t:"GT",r:"Bowler",o:false},{n:"Jayant Yadav",t:"GT",r:"All-Rounder",o:false},{n:"Glenn Phillips",t:"GT",r:"Batter",o:true},{n:"Jason Holder",t:"GT",r:"All-Rounder",o:true},{n:"Ashok Sharma",t:"GT",r:"Bowler",o:false},{n:"Tom Banton",t:"GT",r:"Wicketkeeper",o:true},{n:"Prithviraj Yarra",t:"GT",r:"Bowler",o:false},{n:"Kulwant Khejroliya",t:"GT",r:"Bowler",o:false},{n:"Luke Wood",t:"GT",r:"Bowler",o:true},{n:"Connor Esterhuizen",t:"GT",r:"Wicketkeeper",o:true},
{n:"Yashasvi Jaiswal",t:"RR",r:"Batter",o:false},{n:"Vaibhav Suryavanshi",t:"RR",r:"Batter",o:false},{n:"Dhruv Jurel",t:"RR",r:"Wicketkeeper",o:false},{n:"Riyan Parag",t:"RR",r:"All-Rounder",o:false},{n:"Shimron Hetmyer",t:"RR",r:"Batter",o:true},{n:"Shubham Dubey",t:"RR",r:"Batter",o:false},{n:"Yudhvir Singh Charak",t:"RR",r:"Bowler",o:false},{n:"Jofra Archer",t:"RR",r:"Bowler",o:true},{n:"Tushar Deshpande",t:"RR",r:"Bowler",o:false},{n:"Sandeep Sharma",t:"RR",r:"Bowler",o:false},{n:"Kwena Maphaka",t:"RR",r:"Bowler",o:true},{n:"Nandre Burger",t:"RR",r:"Bowler",o:true},{n:"Lhuan-dre Pretorius",t:"RR",r:"Wicketkeeper",o:true},{n:"Ravindra Jadeja",t:"RR",r:"All-Rounder",o:false},{n:"Donovan Ferreira",t:"RR",r:"Wicketkeeper",o:true},{n:"Sam Curran",t:"RR",r:"All-Rounder",o:true},{n:"Ravi Bishnoi",t:"RR",r:"Bowler",o:false},{n:"Ravi Singh",t:"RR",r:"Batter",o:false},{n:"Sushant Mishra",t:"RR",r:"Bowler",o:false},{n:"Brijesh Sharma",t:"RR",r:"All-Rounder",o:false},{n:"Aman Rao Perala",t:"RR",r:"Batter",o:false},{n:"Vignesh Puthur",t:"RR",r:"Bowler",o:false},{n:"Yash Raj Punja",t:"RR",r:"Bowler",o:false},{n:"Kuldeep Sen",t:"RR",r:"Bowler",o:false},{n:"Adam Milne",t:"RR",r:"Bowler",o:true},{n:"Dasun Shanaka",t:"RR",r:"All-Rounder",o:true},
{n:"Pat Cummins",t:"SRH",r:"Bowler",o:true},{n:"Travis Head",t:"SRH",r:"Batter",o:true},{n:"Abhishek Sharma",t:"SRH",r:"All-Rounder",o:false},{n:"Aniket Verma",t:"SRH",r:"Batter",o:false},{n:"Smaran Ravichandran",t:"SRH",r:"Batter",o:false},{n:"Ishan Kishan",t:"SRH",r:"Wicketkeeper",o:false},{n:"Heinrich Klaasen",t:"SRH",r:"Wicketkeeper",o:true},{n:"Nitish Kumar Reddy",t:"SRH",r:"All-Rounder",o:false},{n:"Harsh Dubey",t:"SRH",r:"All-Rounder",o:false},{n:"Kamindu Mendis",t:"SRH",r:"All-Rounder",o:true},{n:"Harshal Patel",t:"SRH",r:"Bowler",o:false},{n:"Brydon Carse",t:"SRH",r:"Bowler",o:true},{n:"Jaydev Unadkat",t:"SRH",r:"Bowler",o:false},{n:"Eshan Malinga",t:"SRH",r:"Bowler",o:true},{n:"Zeeshan Ansari",t:"SRH",r:"Bowler",o:false},{n:"Liam Livingstone",t:"SRH",r:"All-Rounder",o:true},{n:"Jack Edwards",t:"SRH",r:"All-Rounder",o:true},{n:"David Payne* (ENG)",t:"SRH",r:"Bowler",o:true},{n:"Salil Arora",t:"SRH",r:"Wicketkeeper",o:false},{n:"Shivam Mavi",t:"SRH",r:"Bowler",o:false},{n:"Krains Fuletra",t:"SRH",r:"Bowler",o:false},{n:"Praful Hinge",t:"SRH",r:"Bowler",o:false},{n:"Amit Kumar",t:"SRH",r:"All-Rounder",o:false},{n:"Onkar Tarmale",t:"SRH",r:"Batter",o:false},{n:"Sakib Hussain",t:"SRH",r:"Bowler",o:false},{n:"Shivang Kumar",t:"SRH",r:"Bowler",o:false},{n:"Dilshan Madushanka",t:"SRH",r:"Bowler",o:true},{n:"Gerald Coetzee",t:"SRH",r:"Bowler",o:true},
{n:"Rishabh Pant",t:"LSG",r:"Wicketkeeper",o:false},{n:"Abdul Samad",t:"LSG",r:"Batter",o:false},{n:"Ayush Badoni",t:"LSG",r:"Batter",o:false},{n:"Aiden Markram",t:"LSG",r:"Batter",o:true},{n:"Mitchell Marsh",t:"LSG",r:"All-Rounder",o:true},{n:"Matthew Breetzke",t:"LSG",r:"Batter",o:true},{n:"Nicholas Pooran",t:"LSG",r:"Wicketkeeper",o:true},{n:"Himmat Singh",t:"LSG",r:"Batter",o:false},{n:"Shahbaz Ahmed",t:"LSG",r:"All-Rounder",o:false},{n:"Arshin Kulkarni",t:"LSG",r:"All-Rounder",o:false},{n:"Mayank Yadav",t:"LSG",r:"Bowler",o:false},{n:"Avesh Khan",t:"LSG",r:"Bowler",o:false},{n:"Mohsin Khan",t:"LSG",r:"Bowler",o:false},{n:"Digvesh Rathi",t:"LSG",r:"Bowler",o:false},{n:"M. Siddharth",t:"LSG",r:"Bowler",o:false},{n:"Prince Yadav",t:"LSG",r:"All-Rounder",o:false},{n:"Akash Singh",t:"LSG",r:"Bowler",o:false},{n:"Arjun Tendulkar",t:"LSG",r:"All-Rounder",o:false},{n:"Mohammed Shami",t:"LSG",r:"Bowler",o:false},{n:"Naman Tiwari",t:"LSG",r:"Bowler",o:false},{n:"Wanindu Hasaranga",t:"LSG",r:"All-Rounder",o:true},{n:"Josh Inglis",t:"LSG",r:"Wicketkeeper",o:true},{n:"Akshat Raghuwanshi",t:"LSG",r:"Batter",o:false},{n:"Anrich Nortje",t:"LSG",r:"Bowler",o:true},{n:"Mukul Choudhary",t:"LSG",r:"Bowler",o:false},{n:"George Linde",t:"LSG",r:"All-Rounder",o:true},
{n:"Axar Patel",t:"DC",r:"All-Rounder",o:false},{n:"KL Rahul",t:"DC",r:"Wicketkeeper",o:false},{n:"Tristan Stubbs",t:"DC",r:"Wicketkeeper",o:true},{n:"Sameer Rizvi",t:"DC",r:"Batter",o:false},{n:"Karun Nair",t:"DC",r:"Batter",o:false},{n:"Abishek Porel",t:"DC",r:"Wicketkeeper",o:false},{n:"Ashutosh Sharma",t:"DC",r:"Batter",o:false},{n:"Vipraj Nigam",t:"DC",r:"Bowler",o:false},{n:"Madhav Tiwari",t:"DC",r:"Bowler",o:false},{n:"Tripurana Vijay",t:"DC",r:"All-Rounder",o:false},{n:"Ajay Mandal",t:"DC",r:"All-Rounder",o:false},{n:"Kuldeep Yadav",t:"DC",r:"Bowler",o:false},{n:"Mitchell Starc",t:"DC",r:"Bowler",o:true},{n:"T. Natarajan",t:"DC",r:"Bowler",o:false},{n:"Mukesh Kumar",t:"DC",r:"Bowler",o:false},{n:"Dushmantha Chameera",t:"DC",r:"Bowler",o:true},{n:"Nitish Rana",t:"DC",r:"All-Rounder",o:false},{n:"Auqib Dar",t:"DC",r:"Bowler",o:false},{n:"Pathum Nissanka",t:"DC",r:"Batter",o:true},{n:"Kyle Jamieson",t:"DC",r:"Bowler",o:true},{n:"Lungisani Ngidi",t:"DC",r:"Bowler",o:true},{n:"Ben Duckett",t:"DC",r:"Batter",o:true},{n:"David Miller",t:"DC",r:"Batter",o:true},{n:"Prithvi Shaw",t:"DC",r:"Batter",o:false},{n:"Sahil Parakh",t:"DC",r:"Batter",o:false}
];

const ERRS={'auth/invalid-credential':'Invalid email or password.','auth/user-not-found':'No account with this email.','auth/wrong-password':'Incorrect password.','auth/email-already-in-use':'Email already registered. Try signing in.','auth/weak-password':'Password must be at least 6 characters.','auth/invalid-email':'Enter a valid email address.','auth/too-many-requests':'Too many attempts. Please wait.','auth/unauthorized-domain':'Domain not authorized -- add it in Firebase Console -> Auth -> Authorized Domains.'};

let user=null,draftId=null,draftState=null,draftListener=null;
const SUPER_ADMIN='namanmehra@gmail.com';
function isSuperAdminEmail(email){ return (email||'').toLowerCase().trim()==='namanmehra@gmail.com'; }
// Expose for cd-app.js (classic script, can't import module scope)
if(typeof window !== 'undefined'){ window.isSuperAdminEmail = isSuperAdminEmail; }
function escapeHtml(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

// -- Overseas detection helper (name-based: "* (" suffix means overseas) --
function isOverseasPlayer(p){ return !!(p.isOverseas||p.o||((p.name||p.n||'').indexOf('* (')>=0)); }

// -- Role SVG Icons (inline, currentColor, 24x24 viewBox) --
const ROLE_SVGS={
  batter:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2L7 14l2.5 1L17 3z"/><path d="M9 14.5L7 21"/><path d="M8.2 16.8l1.8.7"/><path d="M7.7 18.5l1.8.7"/></svg>`,
  bowler:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M8.5 4.5C6.5 7.5 6.5 16.5 8.5 19.5"/><path d="M15.5 4.5C17.5 7.5 17.5 16.5 15.5 19.5"/><line x1="7.5" y1="7.5" x2="6.8" y2="6.8"/><line x1="7" y1="9.5" x2="6.2" y2="9.3"/><line x1="6.8" y1="12" x2="6" y2="12"/><line x1="7" y1="14.5" x2="6.2" y2="14.7"/><line x1="7.5" y1="16.5" x2="6.8" y2="17.2"/><line x1="16.5" y1="7.5" x2="17.2" y2="6.8"/><line x1="17" y1="9.5" x2="17.8" y2="9.3"/><line x1="17.2" y1="12" x2="18" y2="12"/><line x1="17" y1="14.5" x2="17.8" y2="14.7"/><line x1="16.5" y1="16.5" x2="17.2" y2="17.2"/></svg>`,
  wicketkeeper:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 11V8a6 6 0 0 1 12 0v3"/><path d="M4 11c0 5 3.5 8.5 8 10c4.5-1.5 8-5 8-10H4z"/><path d="M9 14.5l1.5 1.5L12 14.5l1.5 1.5L15 14.5"/><circle cx="9" cy="11.5" r="0.5" fill="currentColor" stroke="none"/><circle cx="15" cy="11.5" r="0.5" fill="currentColor" stroke="none"/></svg>`,
  allrounder:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3.5L2.5 11l2 .8L6 4.5z"/><path d="M3.8 11.5L3 16"/><circle cx="15" cy="9" r="5.5"/><path d="M12.5 5.5c-1 1.5-1 5.5 0 7"/><path d="M17.5 5.5c1 1.5 1 5.5 0 7"/><line x1="11.5" y1="7" x2="10.8" y2="6.5"/><line x1="11.2" y1="9" x2="10.5" y2="9"/><line x1="11.5" y1="11" x2="10.8" y2="11.5"/><line x1="18.5" y1="7" x2="19.2" y2="6.5"/><line x1="18.8" y1="9" x2="19.5" y2="9"/><line x1="18.5" y1="11" x2="19.2" y2="11.5"/><path d="M7 18l4 3.5L15 18l-4-2z" stroke-width="1.5"/></svg>`
};
function roleIcon(role,size){
  const s=size||16;
  const r=(role||'').toLowerCase().replace(/[^a-z]/g,'');
  let key='batter';
  if(r.includes('bowl'))key='bowler';
  else if(r.includes('wicket')||r.includes('keeper'))key='wicketkeeper';
  else if(r.includes('all'))key='allrounder';
  return ROLE_SVGS[key].replace(/width="\d+"/g,`width="${s}"`).replace(/height="\d+"/g,`height="${s}"`);
}

// -- One-time migration: fix overseas flags in roster data --
let _overseasMigrationDone={};
function migrateOverseasFlags(rid,data){
 if(_overseasMigrationDone[rid]) return;
 _overseasMigrationDone[rid]=true;
 if(!data?.teams) return;
 const upd={};
 let needsWrite=false;
 Object.entries(data.teams).forEach(([tname,team])=>{
  const roster=Array.isArray(team.roster)?team.roster:(team.roster?Object.values(team.roster):[]);
  roster.forEach((p,i)=>{
   const name=p.name||p.n||'';
   const shouldBeOverseas=name.indexOf('* (')>=0;
   if(shouldBeOverseas&&!p.isOverseas&&!p.o){
    upd[`drafts/${rid}/teams/${tname}/roster/${i}/isOverseas`]=true;
    needsWrite=true;
   }
  });
 });
 // Also fix players list
 if(data.players){
  const pArr=Array.isArray(data.players)?data.players:Object.values(data.players);
  pArr.forEach((p,i)=>{
   const name=p.name||p.n||'';
   if(name.indexOf('* (')>=0&&!p.isOverseas){
    upd[`drafts/${rid}/players/${i}/isOverseas`]=true;
    needsWrite=true;
   }
  });
 }
 if(needsWrite) update(ref(db),upd).catch(e=>console.warn('Overseas migration:',e));
}

// -- One-time migration: backfill missing squad snapshots for historical matches --
let _snapshotMigrationDone={};
function migrateSquadSnapshots(rid,data){
 if(_snapshotMigrationDone[rid]) return;
 _snapshotMigrationDone[rid]=true;
 if(!data?.matches||!data?.teams) return;
 const mp=data.maxPlayers||data.setup?.maxPlayers||20;
 const snaps=buildSquadSnapshots(data.teams,mp);
 if(!Object.keys(snaps).length) return;
 const upd={};
 let needsWrite=false;
 Object.entries(data.matches).forEach(([mid,m])=>{
  if(!m.squadSnapshots||!Object.keys(m.squadSnapshots).length){
   upd[`drafts/${rid}/matches/${mid}/squadSnapshots`]=snaps;
   needsWrite=true;
  }
 });
 if(needsWrite) update(ref(db),upd).then(()=>console.log('Backfilled squad snapshots for',rid)).catch(e=>console.warn('Snapshot migration:',e));
}

// -- One-time migration: fix duck points retroactively --
let _duckMigrationDone={};
function migrateDuckPoints(rid,data){
 if(_duckMigrationDone[rid]) return;
 _duckMigrationDone[rid]=true;
 if(!data?.matches) return;
 const upd={};
 let needsWrite=false;
 Object.entries(data.matches).forEach(([mid,m])=>{
  if(!m.players) return;
  Object.entries(m.players).forEach(([pkey,p])=>{
   const bd=(p.breakdown||'').toLowerCase();
   // Find players with 0 runs who didn't get duck penalty yet (case-insensitive check)
   if(bd.indexOf('bat(0r')>=0&&bd.indexOf('duck')<0){
    const pName=(p.name||'').toLowerCase().trim();
    const pClean=pName.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
    let role='';
    if(data.players){
     const pArr=Array.isArray(data.players)?data.players:Object.values(data.players);
     const found=pArr.find(x=>{const xn=(x.name||x.n||'').toLowerCase().trim();return xn===pName||xn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim()===pClean;});
     if(found) role=(found.role||found.r||'').toLowerCase();
    }
    if(!role){const rd=RAW.find(x=>{const xn=(x.n||'').toLowerCase().trim();return xn===pName||xn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim()===pClean;});if(rd)role=(rd.r||'').toLowerCase();}
    if(role&&role!=='bowler'){
     upd[`drafts/${rid}/matches/${mid}/players/${pkey}/pts`]=(p.pts||0)-5;
     upd[`drafts/${rid}/matches/${mid}/players/${pkey}/breakdown`]=(p.breakdown||'')+' | DUCK: -5';
     needsWrite=true;
    }
   }
  });
 });
 // Also repair any players where duck was applied multiple times (the 3x bug)
 Object.entries(data.matches).forEach(([mid,m])=>{
  if(!m.players) return;
  Object.entries(m.players).forEach(([pkey,p])=>{
   const bd=p.breakdown||'';
   // Count how many times "Duck" or "DUCK" appears
   const duckMatches=(bd.match(/[Dd]uck:\s*-5/g)||[]).length;
   if(duckMatches>1){
    // Remove all duck penalties and re-apply exactly once
    const extraPenalties=(duckMatches-1)*5; // restore over-deducted points
    const cleanBd=bd.replace(/\s*\|\s*[Dd]uck:\s*-5/g,'')+ ' | DUCK: -5';
    upd[`drafts/${rid}/matches/${mid}/players/${pkey}/pts`]=(p.pts||0)+extraPenalties;
    upd[`drafts/${rid}/matches/${mid}/players/${pkey}/breakdown`]=cleanBd;
    needsWrite=true;
   }
  });
 });
 if(needsWrite) update(ref(db),upd).then(()=>{console.log('Duck points corrected for',rid);window.showAlert('Duck penalties corrected.','ok');}).catch(e=>console.warn('Duck migration:',e));
}

let isAdmin=false,myTeamName='',isSignup=false,pendingJoinId='',roomToDelete='';
let cachedPlayers=null;
let releaseTeam='',releasePlayerName='',releaseWasOverseas=false;
let replaceTeam='',replacePlayerName='',replaceWasOverseas=false;

// -- Toast --

window.toggleDark=function(){
  var isLight=document.body.classList.toggle('light');
  localStorage.setItem('ipl-theme',isLight?'light':'dark');
  var btn=document.getElementById('darkToggle');
  if(btn) btn.innerHTML=isLight?'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>':'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
};

window.showAlert=function(msg,type='err'){
 const t=document.getElementById('toast');
 document.getElementById('tmsg').textContent=msg;
 t.className=`show ${type}`;
 clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),4800);
};

// -- View helpers --
function showAuth(){document.getElementById('auth-view').classList.add('active');document.getElementById('app-shell').classList.remove('active');}
function showApp(){
 document.getElementById('auth-view').classList.remove('active');
 document.getElementById('app-shell').classList.add('active');
 const _tbu=document.getElementById('topbarUser'); if(_tbu) _tbu.textContent=user?.email||'';
 const saTab=document.getElementById('dt-superadmin');
 if(saTab) saTab.style.display=isSuperAdminEmail(user?.email)?'block':'none';
}
function showInner(id){['dashboard-view','draft-view'].forEach(v=>document.getElementById(v).classList.remove('active'));document.getElementById(id).classList.add('active');}

window.switchDashTab=function(tab){
 ['scorecards','created','joined','superadmin'].forEach(t=>{
 document.getElementById(`dt-${t}`).classList.toggle('active',t===tab);
 document.getElementById(`tab-${t}`).style.display=t===tab?'block':'none';
 });
 if(tab==='superadmin') renderSuperAdminPanel();
 if(tab==='scorecards'){
 renderGlobalScorecardHistory();
 // Pre-build the player datalist from RAW so it's ready immediately
 if(!document.getElementById('gscDlPlayers')){
 const dl=document.createElement('datalist'); dl.id='gscDlPlayers';
 [...new Set((RAW||[]).map(p=>p.n||'').filter(Boolean))].sort().forEach(n=>{
 const o=document.createElement('option'); o.value=n; dl.appendChild(o);
 });
 document.body.appendChild(dl);
 }
 }
};
window.toggleCreateForm=function(){
 const f=document.getElementById('create-form'),btn=document.getElementById('createToggleBtn');
 const show=f.style.display==='none';f.style.display=show?'block':'none';
 btn.textContent=show?'x Cancel':'+ Create New';
};
window._lbToggleExpand=function(id){
 const panel=document.getElementById(id);
 if(!panel) return;
 const row=panel.previousElementSibling;
 const isOpen=panel.classList.contains('open');
 document.querySelectorAll('.lb-expand-panel.open').forEach(p=>{ p.classList.remove('open'); p.previousElementSibling?.classList.remove('lb-expanded'); });
 if(!isOpen){ panel.classList.add('open'); row?.classList.add('lb-expanded'); }
};

window.switchTab=function(t){
 ['setup','draft','teams','roster','points','leaderboard','players-season','analytics','matches','myteam','schedule','trades'].forEach(id=>{
 const el=document.getElementById(`${id}-tab`),btn=document.getElementById(`btn-${id}`);
 if(el){ el.style.display=id===t?'block':'none';
  if(id===t){ el.classList.remove('tab-anim'); void el.offsetWidth; el.classList.add('tab-anim'); }
 }
 if(btn) btn.classList.toggle('active',id===t);
 const sbLink=document.getElementById(`sb-${id}`);
 if(sbLink) sbLink.classList.toggle('active',id===t);
 try{
  if(id===t&&id==='players-season'&&draftState) renderPlayersSeasonDraft(draftState);
  if(id===t&&id==='myteam') window.renderMyTeamD();
  if(id===t&&id==='schedule') window.renderSchedule();
  if(id===t&&id==='trades') window.loadTradeDropdowns();
  if(id===t&&id==='points'&&draftState) renderPointsDraft();
  if(id===t&&id==='draft') startLiveTicker();
  if(id===t&&id==='draft'&&draftState?.setup?.isStarted&&draftState?.draftOrder){
   const _ms=draftState.members?Object.values(draftState.members):[];
   const _ord=Array.isArray(draftState.draftOrder)?draftState.draftOrder:Object.values(draftState.draftOrder||[]);
   const _ppt=draftState.config?.picksPerTeam||draftState.setup?.picksPerTeam||15;
   const _tc=_ms.length||Math.round(_ord.length/(_ppt||15))||7;
   renderDraftTab(draftState,_tc,_ppt);
  }
 }catch(e){ console.error('switchTab render error:',e); }
 });
};

// -- Auth --
getRedirectResult(auth).then(r=>{
 if(r?.user){
 window.showAlert('Signed in with Google!','ok');
 setTimeout(()=>{
 const saTab=document.getElementById('dt-superadmin');
 if(saTab&&r.user) saTab.style.display=isSuperAdminEmail(r.user.email)?'block':'none';
 },300);
 }
}).catch(e=>{if(e.code&&e.code!=='auth/no-current-user')window.showAlert(ERRS[e.code]||e.message);});

onAuthStateChanged(auth,u=>{
 user=u;
 const dp=new URLSearchParams(window.location.search).get('draft');
 if(u){
 showApp();
 setTimeout(()=>{ const s=document.getElementById('dt-superadmin'); if(s) s.style.display=isSuperAdminEmail(u.email)?'block':'none'; },200);
 if(dp)loadDraftRoom(dp);else loadDash();
 }
 else showAuth();
});

window.toggleAuthMode=function(){
 isSignup=!isSignup;
 document.getElementById('authLabel').textContent=isSignup?'Create your account':'Sign in to continue';
 document.getElementById('authBtn').textContent=isSignup?'Create Account':'Sign In';
 document.getElementById('authToggleBtn').textContent=isSignup?'Already have an account? Sign in':'Create an account instead';
 document.getElementById('pwHint').style.display=isSignup?'block':'none';
};
window.handleAuth=function(){
 const email=document.getElementById('authEmail').value.trim();
 const pass=document.getElementById('authPassword').value;
 if(!email||!pass)return window.showAlert('Enter your email and password.');
 if(isSignup&&pass.length<6)return window.showAlert('Password must be at least 6 characters.');
 const fn=isSignup?createUserWithEmailAndPassword:signInWithEmailAndPassword;
 fn(auth,email,pass).then(()=>window.showAlert(isSignup?'Account created! Welcome.':'Signed in!','ok')).catch(e=>window.showAlert(ERRS[e.code]||e.message));
};
window.signInWithGoogle=function(){
 signInWithPopup(auth,gp).then(()=>window.showAlert('Signed in!','ok')).catch(e=>{
 if(['auth/popup-blocked','auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(e.code))signInWithRedirect(auth,gp);
 else window.showAlert(ERRS[e.code]||e.message);
 });
};
window.resetPassword=function(){
 const email=document.getElementById('authEmail').value.trim();
 if(!email)return window.showAlert('Enter your email first.');
 sendPasswordResetEmail(auth,email).then(()=>window.showAlert('Reset link sent!','ok')).catch(e=>window.showAlert(e.message));
};
window.signOut=window.logoutUser=function(){
 // Clean up all listeners
 if(draftListener){draftListener();draftListener=null;}
 if(window._draftRenderTimer){clearTimeout(window._draftRenderTimer);window._draftRenderTimer=null;}
 // Clear all global state to prevent stale data leaking to next session
 draftState=null; myTeamName=''; isAdmin=false; user=null;
 window._autoFixDoneD=false;
 signOut(auth).then(()=>{
  // Full page reload ensures clean slate
  window.location.href=window.location.pathname;
 });
};

// -- Dashboard --
function draftCardHTML(key,room,isOwner){
 const del=isOwner?`<button class="btn btn-danger btn-sm" onclick="window.openDeleteModal('${key}','${escapeHtml(room.name||'Draft')}')">Delete</button>`:'';
 const leaveBtn=!isOwner?`<button class="btn btn-ghost btn-sm" style="color:var(--err);border-color:rgba(239,68,68,.3);" onclick="window.leaveDraftRoom('${key}','${escapeHtml(room.name||'Draft')}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Leave</button>`:'';
 return`<div class="rc"><div class="rc-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 12 2 2 4-4"/></svg></div><div class="rc-info"><div class="rc-name">${escapeHtml(room.name||'Draft Room')}</div><div class="rc-meta">${room.maxTeams||'?'} teams . ${room.picksPerTeam||'?'} picks/team . <span class="badge ${isOwner?'bg':'bb'}">${isOwner?'Admin':'Member'}</span></div></div><div class="rc-actions">${del}${leaveBtn}<button class="btn btn-outline btn-sm" onclick="window.location.search='?draft=${key}'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>Enter</button></div></div>`;
}

function loadDash(){
 showInner('dashboard-view');
 window.setSidebarMode&&window.setSidebarMode('dash');
 draftId=null;myTeamName='';isAdmin=false;
 if(draftListener){draftListener();draftListener=null;}
 // Show all dashboard sections at once (scroll layout)
 ['scorecards','created','joined','superadmin'].forEach(t=>{
   const el=document.getElementById(`tab-${t}`);
   if(el) el.style.display='block';
 });
 renderGlobalScorecardHistory();
 const _saTab=document.getElementById('dt-superadmin');
 if(_saTab) _saTab.style.display=isSuperAdminEmail(user?.email)?'block':'none';
 const _saSection=document.getElementById('tab-superadmin');
 if(_saSection) _saSection.style.display=isSuperAdminEmail(user?.email)?'block':'none';
 if(isSuperAdminEmail(user?.email)) renderSuperAdminPanel();
 // Unsubscribe previous dashboard listeners to prevent memory leak / lag
 if(window._dashListenerD1){window._dashListenerD1();window._dashListenerD1=null;}
 if(window._dashListenerD2){window._dashListenerD2();window._dashListenerD2=null;}
 window._dashListenerD1=onValue(ref(db,`users/${user.uid}/drafts`),snap=>{
 const rooms=snap.val(),c=document.getElementById('myDraftsList');
 if(!c) return;
 if(!rooms){c.innerHTML='<div class="empty">No rooms yet -- create one above.</div>';return;}
 // Build HTML once then assign (avoid innerHTML += in loop)
 const _entries=Object.entries(rooms).sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));
 c.innerHTML=_entries.map(([k,r])=>draftCardHTML(k,r,true)).join('');
 });
 window._dashListenerD2=onValue(ref(db,`users/${user.uid}/joinedDrafts`),snap=>{
 const rooms=snap.val(),c=document.getElementById('joinedDraftsList');
 if(!c) return;
 if(!rooms){c.innerHTML='<div class="empty">No joined rooms yet.</div>';return;}
 const _entries=Object.entries(rooms).sort((a,b)=>(b[1].joinedAt||0)-(a[1].joinedAt||0));
 c.innerHTML=_entries.map(([k,r])=>draftCardHTML(k,r,false)).join('');
 });
}

window.leaveDraftRoom=function(rid,name){
 if(!user)return;
 if(!confirm(`Leave "${name}"? You will lose your franchise slot in this draft.`))return;
 remove(ref(db,`users/${user.uid}/joinedDrafts/${rid}`))
 .then(()=>window.showAlert(`Left "${name}".`,'ok'))
 .catch(e=>window.showAlert(e.message));
};

window.createDraftRoom=function(){
 if(!user)return;
 const name=document.getElementById('newRoomName').value.trim()||'My Draft League';
 const maxTeams=parseInt(document.getElementById('newMaxTeams').value)||6;
 const picksPerTeam=parseInt(document.getElementById('newPicksPerTeam').value)||15;
 const maxOverseas=Math.min(8,Math.max(4,parseInt(document.getElementById('newMaxOverseas')?.value)||8));
 const nr=push(ref(db,'drafts'));
 const upd={};
 upd[`users/${user.uid}/drafts/${nr.key}`]={name,maxTeams,picksPerTeam,maxOverseas,createdAt:Date.now()};
 upd[`drafts/${nr.key}/config`]={roomName:name,maxTeams,picksPerTeam,maxOverseas,adminUid:user.uid,createdAt:Date.now()};
 update(ref(db),upd).then(()=>window.location.search=`?draft=${nr.key}`).catch(e=>{
 const msg = e.code === 'PERMISSION_DENIED' || (e.message||'').includes('PERMISSION_DENIED')
   ? 'Permission denied. Please check your Firebase database rules allow authenticated users to create rooms.'
   : e.message;
 window.showAlert(msg);
});
};

// -- Delete --
window.openDeleteModal=function(key,name){roomToDelete=key;document.getElementById('deleteRoomName').textContent=`"${name}"`;document.getElementById('deleteModal').classList.add('open');};
window.closeDeleteModal=function(){document.getElementById('deleteModal').classList.remove('open');roomToDelete='';};
window.confirmDeleteRoom=function(){
 if(!roomToDelete)return;const rid=roomToDelete;window.closeDeleteModal();
 Promise.all([remove(ref(db,`users/${user.uid}/drafts/${rid}`)),remove(ref(db,`drafts/${rid}`))])
 .then(()=>window.showAlert('Draft room deleted.','ok')).catch(e=>window.showAlert(e.message));
};

// -- Join --
window.initiateJoin=function(){
 let val=document.getElementById('joinRoomCode').value.trim();
 if(!val)return window.showAlert('Enter a room code or link.');
 const match=val.match(/[?&]draft=([^&\s]+)/);
 const rid=match?match[1]:val;
 get(ref(db,`drafts/${rid}`)).then(snap=>{
 if(!snap.exists())return window.showAlert('Room not found. Check the code.');
 get(ref(db,`drafts/${rid}/members/${user.uid}`)).then(ms=>{
 if(ms.exists()){window.location.search=`?draft=${rid}`;return;}
 const data=snap.val();
 if(data.setup?.isStarted)return window.showAlert('This draft has already started. You cannot join now.');
 pendingJoinId=rid;
 document.getElementById('modalTeamName').value='';
 document.getElementById('teamNameModal').classList.add('open');
 });
 }).catch(()=>window.showAlert('Room not found.'));
};
window.closeTeamModal=function(){document.getElementById('teamNameModal').classList.remove('open');pendingJoinId='';};
window.confirmTeamName=function(){
 const tn=document.getElementById('modalTeamName').value.trim();
 if(!tn)return window.showAlert('Enter a franchise name.');
 if(tn.length>30)return window.showAlert('Name must be 30 characters or less.');
 if(!pendingJoinId)return;
 const rid=pendingJoinId;
 get(ref(db,`drafts/${rid}`)).then(snap=>{
 const data=snap.val();if(!data)return window.showAlert('Room not found.');
 const cfg=data.config||{};
 const maxTeams=cfg.maxTeams||6;
 const picksPerTeam=cfg.picksPerTeam||15;
 const roomName=cfg.roomName||`Draft ${rid.substring(0,5).toUpperCase()}`;
 const existingMembers=data.members?Object.values(data.members):[];
 const amAdmin=data.config?.adminUid===user.uid;
 // Already registered -- just set myTeamName in memory and close
 if(data.members?.[user.uid]){
 myTeamName=data.members[user.uid].teamName||'';
 window.closeTeamModal();
 // Don't reload -- just update UI in place
 updateMyTeamUI();
 return;
 }
 // Capacity check (admin is exempt -- they created the room, they must be able to join)
 if(!amAdmin&&existingMembers.length>=maxTeams)return window.showAlert(`Room is full -- max ${maxTeams} franchises allowed.`);
 // Block non-admins from joining after draft starts
 if(!amAdmin&&data.setup?.isStarted)return window.showAlert('Draft has already started. You cannot join now.');
 // Name uniqueness
 if(existingMembers.some(m=>m.teamName?.toLowerCase()===tn.toLowerCase()))return window.showAlert('That franchise name is taken. Choose another.');
 const upd={};
 upd[`drafts/${rid}/members/${user.uid}`]={teamName:tn,email:user.email||'',uid:user.uid,joinedAt:Date.now()};
 upd[`users/${user.uid}/joinedDrafts/${rid}`]={name:roomName,teamName:tn,maxTeams,picksPerTeam,joinedAt:Date.now()};
 // Admin also writes to their admin drafts list (so room card shows it)
 if(amAdmin){
 upd[`users/${user.uid}/drafts/${rid}/teamName`]=tn;
 }
 return update(ref(db),upd).then(()=>{
 myTeamName=tn;
 pendingJoinId='';
 document.getElementById('teamNameModal').classList.remove('open');
 updateMyTeamUI();
 if(window._startAfterRegister){
  window._startAfterRegister=false;
  setTimeout(()=>window.startDraft(),400);
 } else {
  window.showAlert(`Franchise "${tn}" registered!`,'ok');
 }
 });
 }).catch(e=>window.showAlert(e.message));
};

function updateMyTeamUI(){
 if(!myTeamName)return;
 const _mb=document.getElementById('myTeamBadge');if(_mb){_mb.style.display='flex';_mb.classList.add('show');}
 document.getElementById('myTeamName').textContent=myTeamName;
 document.getElementById('draftRoleBadge').textContent=isAdmin?' Admin . '+myTeamName:' '+myTeamName;
 // Re-render draft tab so pick box shows immediately if it's their turn
 if(draftState?.setup?.isStarted&&draftState?.draftOrder){
 const members=draftState.members?Object.values(draftState.members):[];
 const ppt=draftState.setup?.picksPerTeam||15;
 renderDraftTab(draftState,members.length,ppt);
 }
}

window.backToDash=function(){
 if(draftListener){draftListener();draftListener=null;}
 history.replaceState({},'',window.location.pathname);loadDash();
};
window.copyInviteLink=function(){
 const url=`${location.origin}${location.pathname}?draft=${draftId}`;
 navigator.clipboard.writeText(url).then(()=>window.showAlert('Invite link copied!','ok')).catch(()=>window.showAlert('Copy failed. Share: '+url,'info'));
};

// -- Load Draft Room --
function loadDraftRoom(rid){
 window.setSidebarMode&&window.setSidebarMode('room');
 showInner('draft-view');
 draftId=rid;isAdmin=false;myTeamName='';

 Promise.all([
 get(ref(db,`users/${user.uid}/drafts/${rid}`)),
 get(ref(db,`drafts/${rid}/members/${user.uid}`)),
 get(ref(db,`drafts/${rid}/config`))
 ]).then(([adminSnap,memberSnap,cfgSnap])=>{
 isAdmin=adminSnap.exists();
 if(memberSnap.exists())myTeamName=memberSnap.val().teamName||'';

 document.getElementById('draftRoleBadge').textContent=isAdmin?' Admin':' '+(myTeamName||'Member');
 document.getElementById('draftRoleBadge').className=`badge ${isAdmin?'bg':'bb'}`;
 var _lbD=document.getElementById('mt_lock_btn_D'); if(_lbD&&isAdmin){ _lbD.style.display='inline-block'; if(draftState){ _lbD.textContent=draftState.squadLocked?'Unlock Changes':'Lock Changes'; _lbD.style.background=draftState.squadLocked?'var(--err-bg)':'var(--surface)'; _lbD.style.color=draftState.squadLocked?'var(--err)':'var(--txt2)'; } }
 document.getElementById('addMatchCardDraft').style.display=isAdmin?'block':'none';
 const mdNoteD=document.getElementById('matchDataAdminNoteD');
 if(mdNoteD) mdNoteD.textContent=isAdmin?'Admin -- click any field to edit':'View only';

 if(myTeamName){
 const _mb=document.getElementById('myTeamBadge');if(_mb){_mb.style.display='flex';_mb.classList.add('show');}
 document.getElementById('myTeamName').textContent=myTeamName;
 }

 if(cfgSnap.exists()&&isAdmin){
 const c=cfgSnap.val();
 document.getElementById('setupConfigBox').innerHTML=
 `Room: <strong style="color:var(--txt)">${c.roomName}</strong>&nbsp;.&nbsp;Max Franchises: <strong style="color:var(--accent)">${c.maxTeams}</strong>&nbsp;.&nbsp;Picks per Franchise: <strong style="color:var(--accent)">${c.picksPerTeam}</strong>`;
 document.getElementById('startHintMax').textContent=c.maxTeams;
 }

 // Both admin AND members need to register a franchise name if they haven't yet
 if(!memberSnap.exists()){
 // Show franchise name modal for everyone who hasn't registered yet
 setTimeout(()=>{
 pendingJoinId=rid;
 document.getElementById('modalTeamName').value='';
 document.getElementById('teamNameModal').classList.add('open');
 },400);
 }

 if(!isAdmin){
 document.getElementById('btn-setup').style.display='none';
 document.getElementById('setup-tab').style.display='none';
 window.switchTab('draft');
 }
 // Re-render now that myTeamName is known -- wait for draftState if needed
 var _retryRender=function(){
  if(draftState&&draftState.setup&&draftState.setup.isStarted&&draftState.draftOrder){
   var _rm=draftState.members?Object.values(draftState.members):[];
   const _pptR=draftState.setup?.picksPerTeam||draftState.config?.picksPerTeam||15;
   const _ordR=Array.isArray(draftState.draftOrder)?draftState.draftOrder:Object.values(draftState.draftOrder||[]);
   const _tcR=_rm.length||Math.round(_ordR.length/(_pptR||15))||7;
   renderDraftTab(draftState,_tcR,_pptR);
  } else if(!draftState){
   setTimeout(_retryRender,200); // draftState not yet set, retry
  }
 };
 _retryRender();
 });

 if(draftListener){draftListener();draftListener=null;}

 draftListener=onValue(ref(db,`drafts/${rid}`),snap=>{
 const data=snap.val();if(!data)return;
 draftState=data;

 // Run one-time migrations
 migrateOverseasFlags(rid,data);
 migrateSquadSnapshots(rid,data);
 migrateDuckPoints(rid,data);

 const cfg=data.config||{};
 const setup=data.setup||{};
 const roomName=setup.roomName||cfg.roomName||`Draft ${rid.substring(0,5).toUpperCase()}`;
 document.getElementById('draftTitleDisplay').textContent=roomName;

 if(setup.isStarted){
 document.getElementById('btn-setup').style.display='none';
 document.getElementById('setup-tab').style.display='none';
 document.getElementById('statsRow').style.display='flex';
 const _draftTabActive=document.getElementById('btn-draft')?.classList.contains('active');
 if(!_draftTabActive) window.switchTab('draft');
 }

 // -- Join progress (Setup tab, admin view) --
 const members=data.members?Object.values(data.members):[];
 const maxTeams=cfg.maxTeams||setup.maxTeams||6;
 const picksPerTeam=cfg.picksPerTeam||setup.picksPerTeam||15;
 // Admin always counts as 1 slot -- joined = registered members + 1 if admin not yet in members
 const adminMemberInList=data.members?.[user.uid];
 const effectiveJoined=adminMemberInList?members.length:members.length+1;
 const joined=effectiveJoined;
 // full = all maxTeams slots accounted for (admin counts even before they register their name)
 // BUT to actually start, admin MUST have registered their franchise name
 const full=joined>=maxTeams;
 const canActuallyStart=full&&!!adminMemberInList; // admin must be registered to start
 const pct=maxTeams>0?Math.min(100,Math.round(joined/maxTeams*100)):0;

 // Progress bar
 const jpCount=document.getElementById('jpCount');
 const jpFill=document.getElementById('jpBarFill');
 const jpStatus=document.getElementById('jpStatus');
 if(jpCount)jpCount.textContent=`${joined} / ${maxTeams}`;
 if(jpFill)jpFill.style.width=pct+'%';
 if(jpStatus){
 if(setup.isStarted){
 jpStatus.className='jp-status ready';
 jpStatus.textContent='Draft is in progress!';
 } else if(full&&!adminMemberInList){
 jpStatus.className='jp-status waiting';
 jpStatus.textContent='All participants joined -- register your franchise above to unlock the start button!';
 } else if(full){
 jpStatus.className='jp-status ready';
 jpStatus.textContent=`All ${maxTeams} franchises have joined -- ready to start!`;
 } else {
 jpStatus.className='jp-status waiting';
 const waiting=maxTeams-joined;
 jpStatus.textContent=`Waiting for ${waiting} more franchise${waiting===1?'':'s'} to join...`;
 }
 }

 // Start Draft button -- only enabled when full and not yet started
 if(isAdmin){
 const btn=document.getElementById('startDraftBtn');
 if(btn){
 const canStart=canActuallyStart&&!setup.isStarted;
 btn.disabled=!canStart;
 if(setup.isStarted){
 btn.textContent='Draft In Progress';
 } else if(full&&!adminMemberInList){
 btn.textContent='Register Your Franchise First ->';
 } else if(full){
 btn.textContent=` Start Snake Draft -- All ${maxTeams} ready!`;
 } else {
 btn.textContent=` Start Snake Draft -- ${joined}/${maxTeams} joined`;
 }
 }

 // Show/hide admin register banner
 const adminMember=data.members?.[user.uid];
 const banner=document.getElementById('adminRegBanner');
 if(banner)banner.style.display=(!setup.isStarted&&!adminMemberInList)?'block':'none';

 // Members list
 const ml=document.getElementById('membersList');
 if(ml){
 // Build display list: registered members + unregistered admin placeholder
 const displayMembers=[...members];
 if(!adminMemberInList && isAdmin){
  displayMembers.unshift({teamName:'(You -- register franchise)',uid:user.uid,email:user.email||'',_pending:true});
 }
 if(displayMembers.length){
  ml.innerHTML='<div class="member-grid">'+displayMembers.map((m,i)=>{
   const isMe=m.uid===user.uid;
   const initials=m._pending?'?':(m.teamName||'?').substring(0,2).toUpperCase();
   const nameHtml=m._pending
    ?`<span style="color:var(--warn);font-style:italic;">${escapeHtml(m.teamName)}</span>`
    :`${escapeHtml(m.teamName||'')}${isMe?'<span class="member-you-badge">You</span>':''}`;
   return `<div class="member-card${isMe?' you':''}">
    <div class="member-avatar" style="${m._pending?'background:var(--warn-bg,#FEF3C7);color:var(--warn);':''}">${initials}</div>
    <div class="member-info">
     <div class="member-team-name">${nameHtml}</div>
     <div class="member-email-sm">${m.email||''}</div>
    </div>
   </div>`;
  }).join('')+'</div>';
 } else {
  ml.innerHTML='<div class="empty">No franchises yet. Share the invite link!</div>';
 }
 }
 }

 // Live franchises bar (Draft tab)
 if(members.length){
 document.getElementById('liveMembersBar').style.display='flex';
 document.getElementById('liveMembersList').innerHTML=members.map(m=>{
 const isMe=m.uid===user.uid;
 return`<span class="badge ${isMe?'bpu':'bb'}" style="padding:5px 10px;">${isMe?' ':''}${escapeHtml(m.teamName)}</span>`;
 }).join('');
 }

 // Players -- roster + dropdown
 if(data.players){
 cachedPlayers=Array.isArray(data.players)?data.players:Object.values(data.players);
 const rem=cachedPlayers.filter(p=>!p.draftedBy).length;
 const drafted=cachedPlayers.filter(p=>!!p.draftedBy).length;
 document.getElementById('st-avail').textContent=rem;
 document.getElementById('st-drafted').textContent=drafted;
 document.getElementById('st-teams').textContent=members.length;
 renderRosterTab();
 }

 // Teams tab
 if(data.teams)renderTeamsTab(data,picksPerTeam);

 // Debounced heavy renders: wait 300ms after last data change before re-rendering
 if(window._draftRenderTimer) clearTimeout(window._draftRenderTimer);
 window._draftRenderTimer=setTimeout(function(){
  var _d=draftState;
  try{renderPointsDraft();}catch(e){console.error('renderPointsDraft:',e);}
  try{renderLeaderboardDraft(_d);}catch(e){console.error('renderLeaderboardDraft:',e);}
  try{renderAnalyticsDraft(_d);}catch(e){console.error('renderAnalyticsDraft:',e);}
  try{renderMatchDataDraft(_d);}catch(e){console.error('renderMatchDataDraft:',e);}
  try{window.renderTrades(_d);}catch(e){console.error('renderTrades:',e);}
 },300);
 var _lBtn=document.getElementById('mt_lock_btn_D'); if(_lBtn){ if(isAdmin) _lBtn.style.display='inline-block'; _lBtn.textContent=data.squadLocked?'Unlock Changes':'Lock Changes'; _lBtn.style.background=data.squadLocked?'var(--err-bg)':'var(--surface)'; _lBtn.style.color=data.squadLocked?'var(--err)':'var(--txt2)'; }
 // Super Admin release lock button
 var _rlBtn=document.getElementById('mt_release_lock_btn_D');
 if(!_rlBtn&&isSuperAdminEmail(user?.email)){
  var _mtTab=document.getElementById('myteam-tab');
  if(_mtTab){
   _rlBtn=document.createElement('button');
   _rlBtn.id='mt_release_lock_btn_D';
   _rlBtn.className='btn btn-sm';
   _rlBtn.style.cssText='margin-left:8px;';
   _rlBtn.onclick=function(){window.toggleReleaseLock_D();};
   var _lBtnParent=document.getElementById('mt_lock_btn_D')?.parentElement;
   if(_lBtnParent) _lBtnParent.appendChild(_rlBtn);
  }
 }
 if(_rlBtn){
  _rlBtn.style.display=isSuperAdminEmail(user?.email)?'inline-block':'none';
  _rlBtn.textContent=data.releaseLocked?'Unlock Releases':'Lock Releases';
  _rlBtn.style.background=data.releaseLocked?'#ff4444':'var(--surface)';
  _rlBtn.style.color=data.releaseLocked?'#fff':'var(--txt2)';
 }
 if(document.getElementById('trades-tab')?.style.display==='block') window.loadTradeDropdowns();
 // Auto-update My Team when state changes
 if(document.getElementById('myteam-tab')?.style.display==='block') _mtRenderD();
 else if(myTeamName && data.teams && data.teams[myTeamName]) {
   var _newRLen=0; var _r=data.teams[myTeamName].roster;
   if(_r) _newRLen=Array.isArray(_r)?_r.length:Object.keys(_r).length;
   if(!_sqSavedD||!_sqSavedD._rLen||_sqSavedD._rLen!==_newRLen){ _sqSavedD=null; }
  }

 // Draft tab -- render now, and again after myTeamName resolves if needed
 if(setup.isStarted&&data.draftOrder){
  const _tcnt=members.length||Math.round((Array.isArray(data.draftOrder)?data.draftOrder:Object.values(data.draftOrder||[])).length/(cfg.picksPerTeam||setup.picksPerTeam||picksPerTeam||15))||7;

 // One-time auto-fix: Digvesh Rathi + Dasun Shanaka (only runs once per session)
 if(!window._autoFixDoneD){
  window._autoFixDoneD=true;
  if(data.teams){ var _df={}; Object.entries(data.teams).forEach(function(e){ var tn=e[0],t=e[1]; var r=Array.isArray(t.roster)?t.roster:(t.roster?Object.values(t.roster):[]); r.forEach(function(p,i){ if((p.name||'').indexOf('Digvesh Rathi')>=0&&(p.role||'')!=='Bowler'){ p.role='Bowler'; _df['drafts/'+draftId+'/teams/'+tn+'/roster/'+i+'/role']='Bowler'; }}); }); if(Object.keys(_df).length>0) update(ref(db),_df).catch(function(){}); }
  if(data.players&&draftId){ var _ap=Array.isArray(data.players)?data.players:Object.values(data.players||{}); if(!_ap.some(function(p){return(p.name||'').indexOf('Dasun Shanaka')>=0;})){ _ap.push({id:_ap.length,name:"Dasun Shanaka",iplTeam:"RR",role:"All-Rounder",isOverseas:true,draftedBy:null}); data.players=_ap; set(ref(db,'drafts/'+draftId+'/players'),_ap).catch(function(){}); } _ap.forEach(function(p,i){ if((p.name||'').indexOf('Digvesh Rathi')>=0&&(p.role||'').toLowerCase()==='batter'){ p.role='Bowler'; update(ref(db),{['drafts/'+draftId+'/players/'+i+'/role']:'Bowler'}).catch(function(){}); }}); }
 }
  renderDraftTab(data,_tcnt,picksPerTeam);
  // If myTeamName not yet set (Promise.all still pending), retry shortly
  if(!myTeamName){
   var _rdata=data,_rlen=members.length,_rppt=picksPerTeam;
   setTimeout(function(){if(myTeamName)renderDraftTab(_rdata,_rlen,_rppt);},300);
   setTimeout(function(){if(myTeamName)renderDraftTab(_rdata,_rlen,_rppt);},800);
   setTimeout(function(){if(myTeamName)renderDraftTab(_rdata,_rlen,_rppt);},1500);
  }
 }
 });
}

// -- Admin franchise registration helper --
window.adminRegisterFranchise=function(){
 if(!draftId)return;
 pendingJoinId=draftId;
 document.getElementById('modalTeamName').value='';
 document.getElementById('teamNameModal').classList.add('open');
};

// -- Start Draft --
window.startDraft=function(){
 if(!isAdmin||!draftId)return;
 get(ref(db,`drafts/${draftId}`)).then(snap=>{
 const data=snap.val();if(!data)return window.showAlert('Draft data not found.');
 const cfg=data.config||{};
 const members=data.members?Object.values(data.members):[];
 const maxTeams=cfg.maxTeams||6;
 const picksPerTeam=cfg.picksPerTeam||15;
 const roomName=cfg.roomName||`Draft ${draftId.substring(0,5).toUpperCase()}`;
 // If admin hasn't registered a franchise name yet, open the modal first
 if(!data.members?.[user.uid]){
  pendingJoinId=draftId;
  window._startAfterRegister=true;
  document.getElementById('modalTeamName').value='';
  document.getElementById('teamNameModal').classList.add('open');
  return;
 }
 if(members.length<maxTeams)return window.showAlert(`Need all ${maxTeams} franchises before starting. Currently ${members.length} of ${maxTeams} registered.`);
 if(data.setup?.isStarted)return window.showAlert('Draft has already started.');

 const players=RAW.map((p,i)=>({id:i,name:p.n,iplTeam:p.t,role:p.r,isOverseas:p.o,draftedBy:null}));

 // Draft order:
 // R1: random shuffle
 // R2: reverse of R1
 // R3+: fresh random each round, guaranteed to start with a different team than R1
 const shuffled=[...members].sort(()=>Math.random()-.5);
 const order=[];
 for(let round=0;round<picksPerTeam;round++){
 let ro;
 if(round===0){
  ro=[...shuffled];
 } else if(round===1){
  ro=[...shuffled].reverse();
 } else {
  // Keep reshuffling until the first team differs from R1's first team
  let attempts=0;
  do { ro=[...members].sort(()=>Math.random()-.5); attempts++; }
  while(attempts<30 && ro[0].uid===shuffled[0].uid);
 }
 ro.forEach(m=>order.push({teamName:m.teamName,uid:m.uid,round:round+1}));
 }

 const teams={};
 members.forEach(m=>{teams[m.teamName]={name:m.teamName,roster:[],overseasCount:0};});

 const upd={};
 upd[`drafts/${draftId}/setup`]={isStarted:true,maxTeams,picksPerTeam,roomName,startedAt:Date.now()};
 upd[`drafts/${draftId}/players`]=players;
 upd[`drafts/${draftId}/teams`]=teams;
 upd[`drafts/${draftId}/draftOrder`]=order;
 upd[`drafts/${draftId}/currentPickIndex`]=0;
 return update(ref(db),upd);
 }).then(()=>window.showAlert(' Draft started! Snake order locked. Round 1 begins now.','ok')).catch(e=>window.showAlert(e.message));
};

// -- Render Draft Tab --
function renderDraftTab(data,teamsCount,picksPerTeam){
 const order=Array.isArray(data.draftOrder)?data.draftOrder:Object.values(data.draftOrder||[]);
 const idx=data.currentPickIndex||0;

 const round=Math.floor(idx/teamsCount)+1;
 const pickInRound=(idx%teamsCount)+1;
 document.getElementById('st-round').textContent=Math.min(round,picksPerTeam);
 document.getElementById('st-pick').textContent=pickInRound;

 const clock=document.getElementById('clockCard');
 const pickBox=document.getElementById('pickBox');

 if(idx>=order.length){
 clock.className='clock-card';
 clock.innerHTML=`<div class="clock-round">Draft Complete</div><div class="clock-name" style="color:var(--ok);font-size:1.8rem">\u1f3c1 All ${picksPerTeam} rounds done!</div><div class="clock-sub">Check the Rosters tab for final squads.</div>`;
 pickBox.style.display='none';
 document.getElementById('orderPills').innerHTML='';
 clearTeamColorWash();
 return;
 }

 const current=order[idx];

 // Auto-skip picks for teams that are already at quota
 var _maxPicks=data.setup&&data.setup.picksPerTeam||data.config&&data.config.picksPerTeam||picksPerTeam||21;
 if(data.teams&&data.teams[current.teamName]){
  var _tr=data.teams[current.teamName].roster;
  var _trArr=Array.isArray(_tr)?_tr:(_tr?Object.values(_tr):[]);
  if(_trArr.length>=_maxPicks&&isAdmin&&!window._autoSkipping){
   window._autoSkipping=true;
   update(ref(db),{['drafts/'+draftId+'/currentPickIndex']:idx+1}).then(function(){
    window._autoSkipping=false;
   }).catch(function(){window._autoSkipping=false;});
   return;
  }
 }

 const isMyTurn=myTeamName&&current.teamName===myTeamName;

 clock.className=`clock-card${isMyTurn?' your-turn':''}`;
 document.getElementById('clockRound').textContent=`Round ${round} . Pick ${pickInRound} of ${teamsCount}`;
 document.getElementById('clockName').textContent=current.teamName;
 document.getElementById('clockSub').textContent=`Snake Draft . ${order.length-idx} picks remaining`;
 const youEl=document.getElementById('clockYou');
 youEl.style.display=isMyTurn?'block':'none';

 pickBox.style.display=isMyTurn?'block':'none';
 if(isMyTurn)window.refreshDropdown();
 else clearTeamColorWash();

 // Order pills
 const pillsEl=document.getElementById('orderPills');
 let html='';
 for(let i=idx;i<Math.min(idx+16,order.length);i++){
 const t=order[i];
 const isCur=i===idx;
 const isMine=myTeamName&&t.teamName===myTeamName;
 const cls=isCur?'cur':isMine?'mine':'';
 const rnd=Math.floor(i/teamsCount)+1;
 const pk=(i%teamsCount)+1;
 html+=`<div class="opill ${cls}" title="Round ${rnd} . Pick ${pk}"><span style="font-size:.60rem;opacity:.65;margin-right:3px;">R${rnd}.${pk}</span>${t.teamName}</div>`;
 }
 pillsEl.innerHTML=html;
 var quotaBox=document.getElementById('fixQuotaBox');
 if(quotaBox&&isAdmin&&data.teams){
  var targetPicks=data.setup&&data.setup.picksPerTeam||data.config&&data.config.picksPerTeam||picksPerTeam||15;
  var _curIdx=data.currentPickIndex||0;
  var _draftOrd=Array.isArray(data.draftOrder)?data.draftOrder:Object.values(data.draftOrder||[]);
  // Count pending picks per team
  var _pendingMap={};
  for(var _pi=_curIdx;_pi<_draftOrd.length;_pi++){
   var _ptn=_draftOrd[_pi].teamName;
   _pendingMap[_ptn]=(_pendingMap[_ptn]||0)+1;
  }
  var shortTeams=[];
  Object.values(data.teams).forEach(function(t){
   var r=Array.isArray(t.roster)?t.roster:(t.roster?Object.values(t.roster):[]);
   var pending=_pendingMap[t.name]||0;
   var actualNeed=targetPicks-r.length-pending;
   if(actualNeed>0) shortTeams.push({name:t.name,has:r.length,pending:pending,needs:actualNeed});
  });
  if(shortTeams.length>0){
   quotaBox.style.display='block';
   document.getElementById('fixQuotaDesc').textContent=shortTeams.map(function(t){return t.name+': '+t.has+'/'+targetPicks+' ('+t.pending+' pending, needs '+t.needs+' more)';}).join(' \u00b7 ');
  } else { quotaBox.style.display='none'; }

  // Always show trim button for admin when draft is active
  var trimBox=document.getElementById('trimPicksBox');
  if(trimBox) trimBox.style.display=isAdmin?'block':'none';
 }
}

window.fixTeamQuota=function(){
 if(!isAdmin||!draftId)return;
 get(ref(db,'drafts/'+draftId)).then(function(snap){
 var data=snap.val();if(!data)return window.showAlert('Draft data not found.');
 var targetPicks=data.setup&&data.setup.picksPerTeam||data.config&&data.config.picksPerTeam||15;
 var members=data.members?Object.values(data.members):[];
 var teams=data.teams||{};
 var draftOrder=Array.isArray(data.draftOrder)?data.draftOrder.slice():Object.values(data.draftOrder||[]);
 var currentIdx=data.currentPickIndex||0;

 // Count PENDING (undrafted) picks per team already in the order
 var pendingPicks={};
 for(var pi=currentIdx;pi<draftOrder.length;pi++){
  var tn=draftOrder[pi].teamName;
  pendingPicks[tn]=(pendingPicks[tn]||0)+1;
 }

 var shortTeams=[],added=0;
 Object.values(teams).forEach(function(t){
  var r=Array.isArray(t.roster)?t.roster:(t.roster?Object.values(t.roster):[]);
  var alreadyPending=pendingPicks[t.name]||0;
  // Actual deficit = target - roster - pending picks already in order
  var deficit=targetPicks-r.length-alreadyPending;
  if(deficit>0){
   var member=members.find(function(m){return m.teamName===t.name;});
   for(var i=0;i<deficit;i++){draftOrder.push({teamName:t.name,uid:member?member.uid:'',round:'comp'});added++;}
   shortTeams.push(t.name+' +'+deficit);
  }
 });
 if(!added)return window.showAlert('All teams at full quota (including pending picks).','ok');
 if(!confirm('Add '+added+' compensatory picks?\n'+shortTeams.join(', ')))return;
 update(ref(db),{['drafts/'+draftId+'/draftOrder']:draftOrder}).then(function(){
  window.showAlert('Added '+added+' compensatory picks.','ok');
 }).catch(function(e){window.showAlert('Failed: '+e.message);});
 });
};

// -- Trim excess draft picks: removes duplicate comp picks so each team has exactly enough to reach quota --
window.trimDraftOrder=function(){
 if(!(isAdmin||isSuperAdminEmail(user?.email))){return window.showAlert('Only admin or super admin can trim picks.','error');}
 if(!draftId){return window.showAlert('No draft loaded.','error');}
 get(ref(db,'drafts/'+draftId)).then(function(snap){
 var data=snap.val();if(!data)return window.showAlert('Draft data not found.');
 var targetPicks=data.setup&&data.setup.picksPerTeam||data.config&&data.config.picksPerTeam||15;
 var teams=data.teams||{};
 var draftOrder=Array.isArray(data.draftOrder)?data.draftOrder.slice():Object.values(data.draftOrder||[]);
 var currentIdx=data.currentPickIndex||0;

 window.showAlert('Scanning... Target: '+targetPicks+' picks/team. Current index: '+currentIdx+'. Total order: '+draftOrder.length,'info');

 // Keep all already-drafted picks (before currentIdx) untouched
 var kept=draftOrder.slice(0,currentIdx);
 var remaining=draftOrder.slice(currentIdx);

 // Calculate how many MORE picks each team actually needs
 var needed={};
 Object.values(teams).forEach(function(t){
  var r=Array.isArray(t.roster)?t.roster:(t.roster?Object.values(t.roster):[]);
  needed[t.name]=Math.max(0,targetPicks-r.length);
 });

 // Go through remaining picks, keep only up to what's needed per team
 var given={};
 var trimmed=[];
 remaining.forEach(function(pick){
  var tn=pick.teamName;
  given[tn]=(given[tn]||0);
  var maxNeeded=needed[tn]||0;
  if(given[tn]<maxNeeded){
   trimmed.push(pick);
   given[tn]++;
  }
 });

 var removed=remaining.length-trimmed.length;
 if(removed===0)return window.showAlert('Draft order is already correct. No excess picks found.','ok');

 var newOrder=kept.concat(trimmed);
 var details=[];
 Object.keys(needed).forEach(function(tn){
  var had=remaining.filter(function(p){return p.teamName===tn;}).length;
  var now=(given[tn]||0);
  if(had!==now) details.push(tn+': '+had+' → '+now);
 });

 if(!confirm('Remove '+removed+' excess picks?\n\n'+details.join('\n')+'\n\nThis will fix the draft order.'))return;
 update(ref(db),{['drafts/'+draftId+'/draftOrder']:newOrder}).then(function(){
  window.showAlert('Trimmed '+removed+' excess picks. Draft order is now correct.','ok');
 }).catch(function(e){window.showAlert('Failed: '+e.message);});
 });
};

// -- Refresh player dropdown --
window.refreshDropdown=function(){
 if(!cachedPlayers){
 // Players not loaded yet -- try again shortly
 setTimeout(window.refreshDropdown,300);
 return;
 }
 const q=(document.getElementById('filterName')?.value||'').toLowerCase();
 const role=document.getElementById('filterRole')?.value||'All';
 const ipl=document.getElementById('filterIPL')?.value||'All';
 const origin=document.getElementById('filterOrigin')?.value||'All';
 let rows=cachedPlayers.filter(p=>!p.draftedBy);
 if(q)rows=rows.filter(p=>p.name.toLowerCase().includes(q)||p.iplTeam.toLowerCase().includes(q));
 if(role!=='All')rows=rows.filter(p=>p.role===role);
 if(ipl!=='All')rows=rows.filter(p=>p.iplTeam===ipl);
 if(origin==='Indian')rows=rows.filter(p=>!p.isOverseas);
 if(origin==='Overseas')rows=rows.filter(p=>p.isOverseas);
 // Overseas limit: if myTeam has 8 OS, remove overseas from options
 if(myTeamName&&draftState?.teams?.[myTeamName]){
  const _myT=draftState.teams[myTeamName];
  const _myR=_myT?Array.isArray(_myT.roster)?_myT.roster:Object.values(_myT.roster||[]):[];
  const _osLim=draftState?.maxOverseas||draftState?.config?.maxOverseas||draftState?.setup?.maxOverseas||8;
  if(_myR.filter(p=>p.isOverseas).length>=_osLim) rows=rows.filter(p=>!p.isOverseas);
 }
 const sel=document.getElementById('playerPickSelect');
 sel.innerHTML=rows.length
 ?rows.map(p=>`<option value="${p.id}">${p.name} -- ${p.iplTeam} | ${p.role}${p.isOverseas?' [ \ufe0f OS]':''}</option>`).join('')
 :'<option value="">No players match filters</option>';
 // Team color wash: show color of currently selected player
 const selPid=sel.value;
 const selPlayer=selPid!==''?rows.find(p=>String(p.id)===String(selPid)):null;
 if(selPlayer) setTeamColorWash(selPlayer.iplTeam); else clearTeamColorWash();
};

// -- Lock in pick --
window.lockInPick=function(){
 if(!draftState||!draftId)return;
 const order=Array.isArray(draftState.draftOrder)?draftState.draftOrder:Object.values(draftState.draftOrder||[]);
 const idx=draftState.currentPickIndex||0;
 if(idx>=order.length)return window.showAlert('Draft is complete.');
 const current=order[idx];
 if(!myTeamName||current.teamName!==myTeamName)return window.showAlert("It's not your turn to pick!");
 const pid=document.getElementById('playerPickSelect').value;
 if(pid===''||pid===null||pid===undefined)return window.showAlert('Select a player first.');
 const players=Array.isArray(draftState.players)?draftState.players.map(p=>({...p})):Object.values(draftState.players||{}).map(p=>({...p}));
 const player=players.find(p=>String(p.id)===String(pid));
 if(!player)return window.showAlert('Player not found.');
 if(player.draftedBy)return window.showAlert('That player is already drafted!');
 // Quota check: prevent picking beyond the per-team limit
 const _maxPicks=draftState?.setup?.picksPerTeam||draftState?.config?.picksPerTeam||21;
 const _curRoster=draftState.teams[current.teamName]?.roster;
 const _curRosterArr=Array.isArray(_curRoster)?_curRoster:(_curRoster?Object.values(_curRoster):[]);
 if(_curRosterArr.length>=_maxPicks){
  // Auto-skip this pick and advance to next
  update(ref(db),{['drafts/'+draftId+'/currentPickIndex']:idx+1}).then(function(){
   window.showAlert(current.teamName+' already has '+_maxPicks+' players. Pick skipped.','info');
  });
  return;
 }
 if(player.isOverseas){
 const team=draftState.teams?.[current.teamName];
 const _osMax=draftState?.config?.maxOverseas||draftState?.setup?.maxOverseas||8;
if((team?.overseasCount||0)>=_osMax)return window.showAlert(`Max ${_osMax} overseas players per team!`);
 }
 player.draftedBy=current.teamName;
 const oldRoster=draftState.teams[current.teamName]?.roster;
 const roster=Array.isArray(oldRoster)?[...oldRoster]:(oldRoster?Object.values(oldRoster):[]);
 roster.push({id:player.id,name:player.name,iplTeam:player.iplTeam,role:player.role,isOverseas:player.isOverseas});
 const upd={};
 upd[`drafts/${draftId}/players`]=players;
 upd[`drafts/${draftId}/teams/${current.teamName}/roster`]=roster;
 if(player.isOverseas)upd[`drafts/${draftId}/teams/${current.teamName}/overseasCount`]=(draftState.teams[current.teamName]?.overseasCount||0)+1;
 upd[`drafts/${draftId}/currentPickIndex`]=idx+1;
 update(ref(db),upd)
  .then(()=>window.showAlert(`${player.name} drafted to ${current.teamName}!`,'ok'))
  .catch(e=>{
    const msg=(e.message||'').includes('PERMISSION_DENIED')
      ? 'Permission denied -- ask the room admin to update the Firebase database rules to allow all authenticated users to write to draft rooms. See the setup guide.'
      : e.message;
    window.showAlert(msg);
  });
};

// -- Player dropdown change: update team color wash --
document.addEventListener('change',function(e){
 if(e.target&&e.target.id==='playerPickSelect'&&cachedPlayers){
  const pid=e.target.value;
  const p=pid!==''?cachedPlayers.find(pl=>String(pl.id)===String(pid)):null;
  if(p) setTeamColorWash(p.iplTeam); else clearTeamColorWash();
 }
});

// -- Teams tab --
function renderTeamsTab(data,ppt){
 const teams=data.teams?Object.values(data.teams):[];
 if(!teams.length){document.getElementById('teamRosterGrid').innerHTML='<div class="empty">Draft not started yet.</div>';return;}
 document.getElementById('teamRosterGrid').innerHTML=teams.map(team=>{
 const roster=Array.isArray(team.roster)?team.roster:(team.roster?Object.values(team.roster):[]);
 const os=roster.filter(p=>p.isOverseas).length;
 const slots=(ppt||15)-roster.length;
 const ind=roster.filter(p=>!p.isOverseas).length;
 return`<div class="tcard"><div class="tcard-hdr">
<div class="tcard-hdr-top"><div class="tname">${team.name}</div></div>
<div class="tcard-pills">
 <div class="tpill pill-picks"><div class="tpill-val">${roster.length}</div><div class="tpill-lbl">Drafted</div></div>
 <div class="tpill pill-slots"><div class="tpill-val">${slots}</div><div class="tpill-lbl">Slots Left</div></div>
 <div class="tpill pill-os"><div class="tpill-val">${os}/${data?.config?.maxOverseas||8}</div><div class="tpill-lbl">Overseas</div></div>
 <div class="tpill pill-ind"><div class="tpill-val">${ind}</div><div class="tpill-lbl">Indian</div></div>
</div></div>${roster.length
 ?`<ul class="troster">${roster.map((p,i)=>`<li style="gap:6px;"><div style="flex:1;min-width:0;"><div><span style="font-size:.75rem;color:var(--dim);margin-right:4px;">#${i+1}</span><strong>${p.name}</strong><span class="iplteam-pill">${p.iplTeam||''}</span>${p.isOverseas?' <span class="badge bb" style="font-size:.65rem;padding:1px 5px;">OS</span>':''}</div><div class="rrole">${p.role}</div></div><button class="rel-btn" data-team="${encodeURIComponent(team.name)}" data-player="${encodeURIComponent(p.name||'')}" data-os="${!!p.isOverseas}" onclick="window.openReleaseModal(decodeURIComponent(this.dataset.team),decodeURIComponent(this.dataset.player),this.dataset.os==='true')"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Release</button><button class="rep-btn" data-team="${encodeURIComponent(team.name)}" data-player="${encodeURIComponent(p.name||'')}" data-os="${!!p.isOverseas}" onclick="window.openReplaceModal(decodeURIComponent(this.dataset.team),decodeURIComponent(this.dataset.player),this.dataset.os==='true')"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Replace</button></li>`).join('')}</ul>`
 :'<div class="empty">No picks yet</div>'}
 </div>`;
 }).join('');
}

// -- Roster tab --
function renderRosterTab(){
 if(!cachedPlayers)return;
 const q=(document.getElementById('rosterSearch')?.value||'').toLowerCase();
 const roleF=document.getElementById('rosterFilterRole')?.value||'';
 const statusF=document.getElementById('rosterFilterStatus')?.value||'';
 let rows=[...cachedPlayers];
 if(q)rows=rows.filter(p=>p.name.toLowerCase().includes(q)||p.iplTeam.toLowerCase().includes(q));
 if(roleF)rows=rows.filter(p=>p.role===roleF);
 const teamFD=document.getElementById('rosterFilterTeam')?.value||'';
 if(teamFD)rows=rows.filter(p=>p.iplTeam===teamFD);
 if(statusF==='available')rows=rows.filter(p=>!p.draftedBy);
 if(statusF==='drafted')rows=rows.filter(p=>!!p.draftedBy);
 const originFD=document.getElementById('rosterFilterOrigin')?.value||'';
 if(originFD==='Indian')rows=rows.filter(p=>!p.isOverseas&&!p.o);
 else if(originFD==='Overseas')rows=rows.filter(p=>!!(p.isOverseas||p.o));
 document.getElementById('rosterCount').textContent=`${rows.length} shown`;
 document.getElementById('rosterTbody').innerHTML=rows.map((p,i)=>`<tr><td style="color:var(--dim)">${i+1}</td><td style="font-weight:600">${p.name}</td><td><span class="badge bg">${p.iplTeam}</span></td><td class="role-icon-cell" title="${p.role}">${roleIcon(p.role)} ${p.role}</td><td style="font-size:.78rem;color:var(--dim2)">${p.isOverseas?' \ufe0f OS':' IND'}</td><td>${p.draftedBy?'<span class="badge bs">Drafted</span>':'<span class="badge bb">Available</span>'}</td><td style="color:var(--accent-light);font-weight:600">${p.draftedBy||'--'}</td></tr>`).join('');
}
window.filterRoster=function(){renderRosterTab();};

// -- CSV Export --
window.exportCSV=function(){
 if(!cachedPlayers)return window.showAlert('No data yet.');
 const csv='#,Player,IPL Team,Role,Origin,Status,Drafted By\n'+cachedPlayers.map((p,i)=>[i+1,`"${p.name}"`,p.iplTeam,p.role,p.isOverseas?'Overseas':'Indian',p.draftedBy?'Drafted':'Available',p.draftedBy||''].join(',')).join('\n');
 const a=document.createElement('a');
 a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
 a.download=`draft_${draftId?.substring(0,6)||'results'}.csv`;
 a.click();
 window.showAlert('CSV downloaded!','ok');
};
// -- Release Player (Draft) --
window.openReleaseModal=function(teamName,playerName,wasOverseas){
 // Super admin release lock check
 if(draftState&&draftState.releaseLocked&&!isSuperAdminEmail(user?.email)){
  return window.showAlert('Player releases are locked by the super admin. Contact the super admin to unlock.','error');
 }
 releaseTeam=teamName;
 releasePlayerName=playerName;
 releaseWasOverseas=!!wasOverseas;
 document.getElementById('releasePlayerDesc').textContent=
 `${playerName} will be removed from ${teamName}'s roster and returned to the available pool.`;
 document.getElementById('releaseModal').classList.add('open');
};
window.closeReleaseModal=function(){
 document.getElementById('releaseModal').classList.remove('open');
 releaseTeam='';releasePlayerName='';releaseWasOverseas=false;
};
window.confirmRelease=function(){
 if(!draftId||!releaseTeam||!releasePlayerName)return;
 // Re-check super admin release lock
 if(draftState&&draftState.releaseLocked&&!isSuperAdminEmail(user?.email)){
  window.closeReleaseModal();
  return window.showAlert('Player releases are locked by the super admin.','error');
 }
 var targetName=releasePlayerName.toLowerCase().trim();
 get(ref(db,'drafts/'+draftId)).then(function(snap){
 var data=snap.val();
 if(!data)return window.showAlert('Draft data not found.');
 // Final lock check from fresh data
 if(data.releaseLocked&&!isSuperAdminEmail(user?.email)){
  window.closeReleaseModal();
  return window.showAlert('Player releases are locked by the super admin.','error');
 }
 var team=data.teams&&data.teams[releaseTeam];
 if(!team)return window.showAlert('Team not found.');
 var rawRoster=team.roster;
 var roster=Array.isArray(rawRoster)?rawRoster.slice():(rawRoster?Object.values(rawRoster):[]);
 var matchIdx=roster.findIndex(function(p){return(p.name||'').toLowerCase().trim()===targetName;});
 if(matchIdx<0)return window.showAlert(releasePlayerName+' not found in roster.');
 var releasedPlayer=roster[matchIdx];
 var newRoster=roster.filter(function(_,i){return i!==matchIdx;});
 var newOsCount=newRoster.filter(function(p){return!!p.isOverseas;}).length;
 var rawPlayers=data.players;
 var allPlayers=Array.isArray(rawPlayers)?rawPlayers:Object.values(rawPlayers||{});
 var dbPlayer=allPlayers.find(function(p){return(p.name||'').toLowerCase().trim()===targetName;});
 var draftOrder=Array.isArray(data.draftOrder)?data.draftOrder.slice():Object.values(data.draftOrder||[]);
 var members=data.members?Object.values(data.members):[];
 var relMember=members.find(function(m){return m.teamName===releaseTeam;});
 draftOrder.push({teamName:releaseTeam,uid:relMember?relMember.uid:'',round:'comp'});
 var upd={};
 upd['drafts/'+draftId+'/teams/'+releaseTeam+'/roster']=newRoster.length>0?newRoster:null;
 upd['drafts/'+draftId+'/teams/'+releaseTeam+'/overseasCount']=newOsCount;
 if(dbPlayer&&dbPlayer.id!=null)upd['drafts/'+draftId+'/players/'+dbPlayer.id+'/draftedBy']=null;
 else if(releasedPlayer.id!=null)upd['drafts/'+draftId+'/players/'+releasedPlayer.id+'/draftedBy']=null;
 upd['drafts/'+draftId+'/draftOrder']=draftOrder;
 update(ref(db),upd).then(function(){
  window.closeReleaseModal();
  window.showAlert(releasePlayerName+' released. Compensatory pick added at end.','ok');
 }).catch(function(e){window.showAlert('Release failed: '+e.message);});
 }).catch(function(e){window.showAlert('Error: '+e.message);});
};

// -- Replace Player (Draft) --
window.openReplaceModal=function(teamName,playerName,wasOverseas){
 replaceTeam=teamName;
 replacePlayerName=playerName;
 replaceWasOverseas=!!wasOverseas;
 document.getElementById('replacePlayerDesc').textContent=
 `Replacing: ${playerName} from ${teamName}`;
 document.getElementById('replaceModal').classList.add('open');
 window.refreshReplaceList();
};
window.closeReplaceModal=function(){
 document.getElementById('replaceModal').classList.remove('open');
 replaceTeam='';replacePlayerName='';replaceWasOverseas=false;
};
window.refreshReplaceList=function(){
 const role=document.getElementById('replaceRoleFilter')?.value||'All';
 const players=cachedPlayers||[];
 let avail=players.filter(p=>!p.draftedBy);
 if(role!=='All') avail=avail.filter(p=>p.role===role);
 const sel=document.getElementById('replacementSelect');
 if(!sel)return;
 sel.innerHTML=avail.length
 ?avail.map(p=>`<option value="${p.id}">${p.name} -- ${p.iplTeam} | ${p.role}${p.isOverseas?' [ \ufe0f OS]':''}</option>`).join('')
 :'<option value="">No available players match this filter</option>';
};
window.confirmReplace=function(){
 if(!draftId||!replaceTeam||!replacePlayerName)return;
 var newPid=document.getElementById('replacementSelect')&&document.getElementById('replacementSelect').value;
 if(!newPid)return window.showAlert('Select a replacement player.','err');
 var targetName=replacePlayerName.toLowerCase().trim();
 get(ref(db,'drafts/'+draftId)).then(function(snap){
 var data=snap.val();
 if(!data)return window.showAlert('Draft data not found.');
 var team=data.teams&&data.teams[replaceTeam];
 if(!team)return window.showAlert('Team not found.');
 var rawRoster=team.roster;
 var roster=Array.isArray(rawRoster)?rawRoster.slice():(rawRoster?Object.values(rawRoster):[]);
 var matchIdx=roster.findIndex(function(p){return(p.name||'').toLowerCase().trim()===targetName;});
 if(matchIdx<0)return window.showAlert(replacePlayerName+' not found in roster.');
 var rawPlayers=data.players;
 var allPlayers=Array.isArray(rawPlayers)?rawPlayers:Object.values(rawPlayers||{});
 var newPlayer=allPlayers.find(function(p){return String(p.id)===String(newPid);});
 if(!newPlayer)return window.showAlert('Replacement not found.');
 if(newPlayer.draftedBy)return window.showAlert(newPlayer.name+' is already drafted!');
 var oldPlayer=roster[matchIdx];
 var currentOs=roster.filter(function(p){return!!p.isOverseas;}).length;
 var losingOs=oldPlayer.isOverseas?1:0;
 var gainingOs=newPlayer.isOverseas?1:0;
 var newOsCount=currentOs-losingOs+gainingOs;
 var maxOs=(data.config&&data.config.maxOverseas)||(data.setup&&data.setup.maxOverseas)||8;
 if(newOsCount>maxOs)return window.showAlert('Overseas limit: '+newOsCount+' > '+maxOs,'err');
 var newRoster=roster.slice();
 newRoster[matchIdx]={id:newPlayer.id,name:newPlayer.name,iplTeam:newPlayer.iplTeam,role:newPlayer.role,isOverseas:!!newPlayer.isOverseas};
 var upd={};
 upd['drafts/'+draftId+'/teams/'+replaceTeam+'/roster']=newRoster;
 upd['drafts/'+draftId+'/teams/'+replaceTeam+'/overseasCount']=newOsCount;
 if(oldPlayer.id!=null)upd['drafts/'+draftId+'/players/'+oldPlayer.id+'/draftedBy']=null;
 upd['drafts/'+draftId+'/players/'+newPid+'/draftedBy']=replaceTeam;
 update(ref(db),upd).then(function(){
  window.closeReplaceModal();
  window.showAlert(oldPlayer.name+' replaced with '+newPlayer.name,'ok');
 }).catch(function(e){window.showAlert('Replace failed: '+e.message);});
 }).catch(function(e){window.showAlert('Error: '+e.message);});
};

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// DRAFT POINTS ENGINE (same scoring rules, draft paths)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function calcBattingPtsD(runs,balls,fours,sixes,dismissal,isWin,isMot,playerRole){
 if(dismissal==='noresult') return 0;
 let p=0;
 p+=runs*1;p+=Math.floor(runs/25)*10;p+=fours*1;p+=sixes*2;
 // Duck: -5 if runs===0 and out (auto-detect). Only penalize Batter, All-rounder, Wicketkeeper — NOT pure Bowler.
 const isDuck = dismissal==='duck' || (runs===0 && dismissal==='out');
 const isBowlerOnly = (playerRole||'').toLowerCase()==='bowler';
 if(isDuck && !isBowlerOnly) p -= 5;
 if(balls>=10||runs>=10){const sr=(runs/balls)*100;if(sr<75)p-=15;else if(sr<100)p-=10;else if(sr<150)p+=5;else if(sr<200)p+=10;else p+=15;}
 if(isWin)p+=5;if(isMot)p+=25;return p;
}
// Eco auto-calc
document.addEventListener('input',function(e){if(e.target.placeholder==='Eco'&&e.target.value)e.target.dataset.manual='1';if(e.target.placeholder==='Eco'&&!e.target.value)delete e.target.dataset.manual;});
function normalizeOvers(ov){
 // Cricket overs: 3.3 means 3 overs + 3 balls = 3.5 true overs for eco calc
 const full=Math.floor(ov);
 const balls=Math.round((ov-full)*10);
 return full+(balls/6);
}
function calcBowlingPtsD(overs,runs,wkts,dots,maidens,isWin,isMot){
 if(overs===0) return isWin?5:0;
 let p=0;p+=wkts*25;if(wkts>=2)p+=10;if(wkts>2)p+=(wkts-2)*10;
 p+=dots*1;p+=maidens*20;
 const eco=runs/normalizeOvers(overs);
 if(eco<=5)p+=15;else if(eco<=8)p+=10;else if(eco<=10)p+=5;else if(eco<=12)p-=10;else p-=15;
 if(isWin)p+=5;if(isMot)p+=25;return p;
}
function calcFieldingPtsD(catches,stumpings,runouts,isWin,isMot){
 let p=catches*10+stumpings*15+runouts*10;
 if(isWin)p+=5;if(isMot)p+=25;return p;
}

let brD=0,bowD=0,fldD=0;
window.toggleMatchFormDraft=function(){
 const body=document.getElementById('matchFormBodyD');
 const btn=event.target;
 const showing=body.style.display!=='none';
 body.style.display=showing?'none':'block';
 btn.textContent=showing?'\u25bc Expand':'\u25b2 Collapse';
 if(!showing&&brD===0){window.addBattingRowD();window.addBowlingRowD();window.addFieldingRowD();}
};

function makeInputD(style=''){
 return `class="sc-input"`;
}
function removeBtn(id){
 return `<button onclick="document.getElementById('${id}').remove();" class="btn btn-danger btn-sm sc-remove-btn">x</button>`;
}

window.addBattingRowD=function(){
 const id=`brd${brD++}`;
 const dv=document.createElement('div');dv.id=id;
 dv.className='sc-row sc-row--batting';
 dv.innerHTML=`<input list="dlPlayersD" placeholder="Player name" id="${id}n" class="sc-input"><input type="number" placeholder="R" id="${id}r" min="0" class="sc-input sc-input--sm"><input type="number" placeholder="B" id="${id}b" min="0" class="sc-input sc-input--sm"><input type="number" placeholder="4s" id="${id}f" min="0" class="sc-input sc-input--sm"><input type="number" placeholder="6s" id="${id}s" min="0" class="sc-input sc-input--sm"><select id="${id}d" class="sc-input"><option value="out">Out</option><option value="notout">Not Out</option><option value="duck">Duck (0)</option></select>${removeBtn(id)}`;
 document.getElementById('battingRowsD').appendChild(dv);
};;
window.addBowlingRowD=function(){
 const id=`bowd${bowD++}`;
 const d=document.createElement('div');d.id=id;
 d.className='sc-row sc-row--bowling';
 d.innerHTML=`<input list="dlPlayersD" placeholder="Player name" id="${id}n" class="sc-input"><input type="number" placeholder="Ov" id="${id}o" min="0" step="0.1" oninput="window.autoEcoD('${id}')" class="sc-input sc-input--sm"><input type="number" placeholder="R" id="${id}r" min="0" oninput="window.autoEcoD('${id}')" class="sc-input sc-input--sm"><input type="number" placeholder="W" id="${id}w" min="0" class="sc-input sc-input--sm"><input type="number" placeholder="Eco" id="${id}e" min="0" step="0.01" title="Auto-fills from Ov+R. Click to override." class="sc-input sc-input--sm"><input type="number" placeholder="0s" id="${id}d" min="0" class="sc-input sc-input--sm"><input type="number" placeholder="Mdns" id="${id}m" min="0" class="sc-input sc-input--sm">${removeBtn(id)}`;
 document.getElementById('bowlingRowsD').appendChild(d);
};
window.addFieldingRowD=function(){
 const id=`fldd${fldD++}`;
 const d=document.createElement('div');d.id=id;
 d.className='sc-row sc-row--fielding';
 d.innerHTML=`<input list="dlPlayersD" placeholder="Player name" id="${id}n" class="sc-input"><input type="number" placeholder="Catches" id="${id}c" min="0" class="sc-input"><input type="number" placeholder="Stumpings" id="${id}st" min="0" class="sc-input"><input type="number" placeholder="Run-outs" id="${id}ro" min="0" class="sc-input">${removeBtn(id)}`;
 document.getElementById('fieldingRowsD').appendChild(d);
};

function collectMatchDraftData(){
 const label=document.getElementById('matchLabelD').value.trim()||`Match ${Date.now()}`;
 const winner=(document.getElementById('mfWinnerD').value||'').trim().toUpperCase();
 const motm=(document.getElementById('mfMotmD').value||'').trim().toLowerCase();
 const result=document.getElementById('mfResultD').value;
 if(result==='noresult') return {label,result,playerPts:{}};
 const playerPts={};
 function addP(name,pts,src){
 const key=name.trim().toLowerCase();if(!key)return;
 if(!playerPts[key])playerPts[key]={name:name.trim(),pts:0,breakdown:[]};
 playerPts[key].pts+=pts;playerPts[key].breakdown.push(`${src}: ${pts>=0?'+':''}${pts}`);
 }

 // Lookup player role from draftState or RAW for duck penalty filtering
 function _lookupPlayerRole(name){
 const nLow=name.trim().toLowerCase();
 const nClean=nLow.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
 if(draftState?.players){
  const p=Object.values(draftState.players).find(p=>{
   const pn=(p.name||p.n||'').toLowerCase().trim();
   return pn===nLow||pn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim()===nClean;
  });
  if(p) return p.role||p.r||'';
 }
 if(draftState?.teams){
  for(const t of Object.values(draftState.teams)){
   const roster=Array.isArray(t.roster)?t.roster:(t.roster?Object.values(t.roster):[]);
   const p=roster.find(x=>{const xn=(x.name||x.n||'').toLowerCase().trim();return xn===nLow||xn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim()===nClean;});
   if(p) return p.role||p.r||'';
  }
 }
 const rd=RAW.find(p=>{
  const pn=(p.n||'').toLowerCase().trim();
  return pn===nLow||pn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim()===nClean;
 });
 return rd?(rd.r||''):'';
 }

 document.querySelectorAll('[id^="brd"][id$="n"]').forEach(inp=>{
 const id=inp.id.slice(0,-1);const name=inp.value.trim();if(!name)return;
 const runs=parseInt(document.getElementById(`${id}r`)?.value)||0;
 const balls=parseInt(document.getElementById(`${id}b`)?.value)||0;
 const fours=parseInt(document.getElementById(`${id}f`)?.value)||0;
 const sixes=parseInt(document.getElementById(`${id}s`)?.value)||0;
 const dis=document.getElementById(`${id}d`)?.value||'out';
 const _pRole=_lookupPlayerRole(name);
 const isDuck=(runs===0&&dis==='out')||dis==='duck';
 addP(name,calcBattingPtsD(runs,balls,fours,sixes,dis,false,name.toLowerCase()===motm,_pRole),`Bat(${runs}r ${balls}b${isDuck&&_pRole.toLowerCase()!=='bowler'?' DUCK':''})`);
 });
 document.querySelectorAll('[id^="bowd"][id$="n"]').forEach(inp=>{
 const id=inp.id.slice(0,-1);const name=inp.value.trim();if(!name)return;
 const ovs=parseFloat(document.getElementById(`${id}o`)?.value)||0;
 const runs=parseInt(document.getElementById(`${id}r`)?.value)||0;
 const wkts=parseInt(document.getElementById(`${id}w`)?.value)||0;
 const dots=parseInt(document.getElementById(`${id}d`)?.value)||0;
 const ecoD=parseFloat(document.getElementById(`${id}e`)?.value)||0;
 const maidens=parseInt(document.getElementById(`${id}m`)?.value)||0;
 addP(name,calcBowlingPtsD(ovs,runs,wkts,dots,maidens,false,name.toLowerCase()===motm),`Bowl(${wkts}w ${ovs}ov ${runs}r eco:${ecoD>0?ecoD.toFixed(2):ovs>0?(runs/normalizeOvers(ovs)).toFixed(2):'--'})`);
 });
 document.querySelectorAll('[id^="fldd"][id$="n"]').forEach(inp=>{
 const id=inp.id.slice(0,-1);const name=inp.value.trim();if(!name)return;
 const c=parseInt(document.getElementById(`${id}c`)?.value)||0;
 const st=parseInt(document.getElementById(`${id}st`)?.value)||0;
 const ro=parseInt(document.getElementById(`${id}ro`)?.value)||0;
 if(c+st+ro===0)return;
 addP(name,calcFieldingPtsD(c,st,ro,false,name.toLowerCase()===motm),`Field(${c}c ${st}st ${ro}ro)`);
 });
 // Winning team bonus — strip * (XX) nationality suffix for matching
 if(winner){
 var _plist = cachedPlayers || RAW || [];
 _plist.forEach(p=>{
 const keyFull=(p.name||p.n||'').toLowerCase();
 const keyClean=keyFull.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
 if((p.iplTeam||p.t||'').toUpperCase()===winner){
  var m=playerPts[keyFull]||playerPts[keyClean];
  if(m){m.pts+=5;m.breakdown.push('Win: +5');}
 }
 });
 }
 return {label,result,winner,motm,playerPts};
}

window.previewPointsDraft=function(){
 const data=collectMatchDraftData();
 if(data.result==='noresult'){window.showAlert('No Result -- no points awarded.','info');return;}
 const entries=Object.values(data.playerPts).sort((a,b)=>b.pts-a.pts);
 if(!entries.length){window.showAlert('No player data entered.','err');return;}
 document.getElementById('previewContentD').innerHTML=`<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.85rem;"><thead><tr style="background:rgba(0,0,0,.3);"><th style="padding:8px 12px;text-align:left;color:var(--accent);">Player</th><th style="padding:8px 12px;text-align:right;color:var(--accent);">Pts</th><th style="padding:8px 12px;text-align:left;color:var(--accent);">Breakdown</th></tr></thead><tbody>${entries.map(e=>`<tr style="border-bottom:1px solid var(--b1);"><td style="padding:8px 12px;font-weight:600;cursor:pointer;" onclick="window.showPlayerModal('${escapeHtml(e.name)}')">${escapeHtml(e.name)}</td><td style="padding:8px 12px;text-align:right;font-family:var(--f);font-size:1.1rem;color:${e.pts>=0?'var(--ok)':'var(--err)'};">${e.pts>=0?'+':''}${e.pts}</td><td style="padding:8px 12px;font-size:.78rem;color:var(--dim2);">${e.breakdown.join(' . ')}</td></tr>`).join('')}</tbody></table></div>`;
 document.getElementById('previewBoxD').style.display='block';
};

window.submitMatchDraft=function(confirmed=false){
 if(!isAdmin){window.showAlert('Only admin can submit match data.','err');return;}
 if(!draftId){window.showAlert('Load a draft room first.','err');return;}
 const data=collectMatchDraftData();
 if(!confirmed){window.previewPointsDraft();return;}
 const matchId=`m${Date.now()}`;
 const rec={label:data.label,result:data.result,winner:data.winner||'',motm:data.motm||'',timestamp:Date.now(),players:{}};
 // Build owner map and activeSquad map for squad-aware scoring
 var _ownerMap={};
 var _activeSquadMap={};
 if(draftState&&draftState.teams){
  Object.values(draftState.teams).forEach(function(t){
   var roster=Array.isArray(t.roster)?t.roster:(t.roster?Object.values(t.roster):[]);
   roster.forEach(function(p){
    var fn=(p.name||p.n||'').toLowerCase().trim();
    var cn=fn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
    _ownerMap[fn]=t.name;
    _ownerMap[cn]=t.name;
   });
   var squad=t.activeSquad||null;
   if(squad&&Array.isArray(squad)){
    var sSet=new Set();
    squad.forEach(function(n){
     var fn2=n.toLowerCase().trim();
     sSet.add(fn2);
     sSet.add(fn2.replace(/\*?\s*\([^)]*\)\s*$/,'').trim());
    });
    _activeSquadMap[t.name]=sSet;
   }
   // If no activeSquad saved, _activeSquadMap[t.name] stays undefined
   // This means inActiveSquad will be set to undefined (not false)
   // and the leaderboard will count all players (backwards compat)
  });
 }
 Object.entries(data.playerPts).forEach(([k,v])=>{
  var fbKey=k.replace(/[.#$\/\[\]]/g,'_');
  var ownerTeam=_ownerMap[(v.name||'').toLowerCase().trim()]||'';
  var inSquad;
  if(ownerTeam&&_activeSquadMap[ownerTeam]){
   inSquad=_activeSquadMap[ownerTeam].has((v.name||'').toLowerCase().trim());
  }
  rec.players[fbKey]={name:v.name,pts:v.pts,breakdown:v.breakdown.join(' | '),ownedBy:ownerTeam,inActiveSquad:inSquad};
 });

 // Save squad snapshots for all teams at this moment
 rec.squadSnapshots=buildSquadSnapshots(draftState?.teams);

 set(ref(db,`drafts/${draftId}/matches/${matchId}`),rec).then(()=>{
 window.showAlert(`"${data.label}" saved!`,'ok');
 // Increment stored leaderboard totals
 var xiMult=parseFloat(draftState?.xiMultiplier)||1;
 var contrib=computeMatchContribution(rec, rec.squadSnapshots, draftState?.teams, xiMult);
 _incrementLeaderboardTotalsD(contrib);
 document.getElementById('previewBoxD').style.display='none';
 document.getElementById('matchFormBodyD').style.display='none';
 document.getElementById('matchLabelD').value='';
 document.getElementById('battingRowsD').innerHTML='';
 document.getElementById('bowlingRowsD').innerHTML='';
 document.getElementById('fieldingRowsD').innerHTML='';
 brD=0;bowD=0;fldD=0;
 updateMatchFilterDraft();
 }).catch(e=>window.showAlert('Save failed: '+e.message));
};

function updateMatchFilterDraft(){
 const sel=document.getElementById('matchFilterD');if(!sel)return;
 const matches=(draftState&&draftState.matches)||{};
 const prev=sel.value;
 sel.innerHTML='<option value="all">All Matches (Total)</option>';
 Object.entries(matches).sort((a,b)=>(a[1].timestamp||0)-(b[1].timestamp||0)).forEach(([id,m])=>{
  const opt=document.createElement('option');
  opt.value=id;opt.textContent=m.label||id;
  sel.appendChild(opt);
 });
 if(prev&&[...sel.options].some(o=>o.value===prev)) sel.value=prev;
}

function getOwnerMapDraft(data){
 const om={};
 if(data.teams) Object.values(data.teams).forEach(team=>{
 const roster=Array.isArray(team.roster)?team.roster:Object.values(team.roster||{});
 roster.forEach(p=>{om[(p.name||'').toLowerCase()]=team.name;});
 });
 return om;
}

function aggregateMatchPts(matches,filterVal){
 const all=Object.keys(matches||{});
 const ids=filterVal==='all'?all:[filterVal];
 const totals={};
 ids.forEach(mid=>{
 const m=(matches||{})[mid];if(!m?.players)return;
 Object.values(m.players).forEach(p=>{
 const key=(p.name||'').toLowerCase();
 if(!totals[key])totals[key]={name:p.name,pts:0,matchCount:0};
 totals[key].pts+=(p.pts||0);totals[key].matchCount++;
 });
 });
 return totals;
}

function renderPointsDraft(){
 if(!draftState)return;
 updateMatchFilterDraft();
 const matches=draftState.matches||{};
 const filterVal=document.getElementById('matchFilterD')?.value||'all';
 const totals=aggregateMatchPts(matches,filterVal);
 const ownerMap=getOwnerMapDraft(draftState);
 const roleMap={};const iplMap={};
 if(cachedPlayers) cachedPlayers.forEach(p=>{roleMap[(p.name||'').toLowerCase()]=p.role||'';iplMap[(p.name||'').toLowerCase()]=p.iplTeam||'';});
 const sorted=Object.values(totals).sort((a,b)=>b.pts-a.pts);
 const tbody=document.getElementById('pointsTbodyD');if(!tbody)return;
 if(!sorted.length){tbody.innerHTML='<tr><td colspan="7" class="pts-empty">No match data yet. Admin can add scorecards above.</td></tr>';return;}
 tbody.innerHTML=sorted.map((p,i)=>{
 const key=p.name.toLowerCase();
 const ptsCls=p.pts>=0?'pts-val-pos':'pts-val-neg';
 return`<tr><td class="pts-idx">${i+1}</td><td class="pts-name" onclick="window.showPlayerModal('${escapeHtml(p.name)}')">${escapeHtml(p.name)}</td><td><span class="badge bg">${iplMap[key]||'--'}</span></td><td class="pts-owner">${ownerMap[key]||'<span class="pts-unowned">Unowned</span>'}</td><td class="pts-role">${roleMap[key]||'--'}</td><td class="pts-count">${p.matchCount}</td><td class="pts-val ${ptsCls}">${p.pts>=0?'+':''}${p.pts}</td></tr>`;
 }).join('');
}
window.renderPointsDraft=renderPointsDraft;

// -- Increment stored leaderboard totals for a single match's contribution --
async function _incrementLeaderboardTotalsD(contrib){
 if(!draftId||!contrib||!Object.keys(contrib).length) return;
 try{
  var snap=await get(ref(db,'drafts/'+draftId+'/leaderboardTotals'));
  var stored=snap.val()||{};
  Object.entries(contrib).forEach(function(ce){
   var tn=ce[0], c=ce[1];
   if(!stored[tn]) stored[tn]={pts:0,topPlayer:'--',topPts:0,playerCount:0};
   stored[tn].pts=Math.round((stored[tn].pts+c.pts)*100)/100;
   // Update topPlayer and playerCount
   var bestName='--', bestPts=0, pCount=0;
   // We need cumulative player data — but we only store team totals.
   // For topPlayer, just keep the current top if its pts are higher than the new contribution's top.
   Object.entries(c.players).forEach(function(pe){
    if(pe[1]!==0) pCount++;
    if(pe[1]>bestPts){bestPts=pe[1];bestName=pe[0];}
   });
   stored[tn].playerCount=(stored[tn].playerCount||0)+pCount;
   if(bestPts>stored[tn].topPts){
    stored[tn].topPts=bestPts;
    stored[tn].topPlayer=bestName;
   }
  });
  await set(ref(db,'drafts/'+draftId+'/leaderboardTotals'),stored);
 }catch(e){console.error('_incrementLeaderboardTotalsD:',e);}
}

// -- Build squad snapshots for all teams --
function buildSquadSnapshots(teamsData,maxPlayers){
 var snapshots={};
 if(!teamsData) return snapshots;
 var mp=maxPlayers||draftState?.maxPlayers||draftState?.setup?.maxPlayers||20;
 Object.values(teamsData).forEach(function(team){
  var roster=Array.isArray(team.roster)?team.roster:(team.roster?Object.values(team.roster):[]);
  if(!roster.length) return;
  var allNames=roster.map(function(p){return p.name||p.n||'';});
  var xi,bench,reserves;
  if(team.activeSquad&&Array.isArray(team.activeSquad)&&team.activeSquad.length>0){
   xi=team.activeSquad.slice(0,11);
   bench=team.activeSquad.slice(11);
   var sqSet=new Set(team.activeSquad.map(function(n){return n.toLowerCase().trim();}));
   reserves=allNames.filter(function(n){return!sqSet.has(n.toLowerCase().trim());});
  } else if(allNames.length<=mp&&allNames.length<=11){
   // All players fit in XI (e.g. maxPlayers=11, roster=11) — treat all as Playing XI
   xi=allNames.slice();
   bench=[];
   reserves=[];
  } else {
   var xiEnd=Math.min(11,allNames.length);
   var benchEnd=Math.min(xiEnd+5,allNames.length);
   xi=allNames.slice(0,xiEnd);
   bench=allNames.slice(xiEnd,benchEnd);
   reserves=allNames.slice(benchEnd);
  }
  snapshots[team.name]={xi:xi,bench:bench,reserves:reserves||[]};
 });
 return snapshots;
}

// -- Player Performance Modal --
window.showPlayerModal=function(playerName){
 if(!draftState||!playerName) return;
 // Create modal DOM if it doesn't exist yet
 var modal=document.getElementById('playerModal');
 if(!modal){
  modal=document.createElement('div');modal.id='playerModal';modal.className='modal-bg';
  modal.innerHTML='<div class="modal modal-lg">'
   +'<div class="modal-header"><h3 id="pmPlayerName">Player</h3><button class="btn btn-ghost btn-sm modal-close" onclick="document.getElementById(\'playerModal\').classList.remove(\'open\')">✕</button></div>'
   +'<div id="pmPlayerMeta" class="modal-meta"></div>'
   +'<div id="pmPlayerBody" class="pm-body"></div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click',function(e){if(e.target===modal) modal.classList.remove('open');});
 }
 var nameEl=document.getElementById('pmPlayerName');
 var metaEl=document.getElementById('pmPlayerMeta');
 var bodyEl=document.getElementById('pmPlayerBody');
 if(!nameEl) return;

 nameEl.textContent=playerName;
 var nLow=playerName.toLowerCase().trim();
 var nClean=nLow.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();

 // Find player info from teams/rosters
 var role='',iplTeam='',isOs=false,owner='';
 if(draftState.teams){
  Object.values(draftState.teams).forEach(function(t){
   var roster=Array.isArray(t.roster)?t.roster:(t.roster?Object.values(t.roster):[]);
   var p=roster.find(function(x){var xn=(x.name||x.n||'').toLowerCase().trim();return xn===nLow||xn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim()===nClean;});
   if(p){owner=t.name;if(!role)role=p.role||p.r||'';if(!iplTeam)iplTeam=p.iplTeam||p.t||'';isOs=isOverseasPlayer(p);}
  });
 }
 // Fallback to RAW
 if(!role){
  var rd=RAW.find(function(x){var xn=(x.n||'').toLowerCase().trim();return xn===nLow||xn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim()===nClean;});
  if(rd){role=rd.r||'';iplTeam=rd.t||'';isOs=isOverseasPlayer(rd);}
 }

 metaEl.innerHTML=
  '<span class="badge bg">'+(iplTeam||'--')+'</span>'
  +'<span class="badge bb">'+(role||'--')+'</span>'
  +(isOs?'<span class="badge pm-overseas-badge">Overseas</span>':'<span class="badge bb">Indian</span>')
  +'<span class="pm-owner-info">'+(owner?'Owned by: '+owner:'Unowned')+'</span>';

 // Build match-by-match breakdown
 var matches=draftState.matches||{};
 var matchList=Object.entries(matches).sort(function(a,b){return(a[1].timestamp||0)-(b[1].timestamp||0);});
 var totalPts=0;
 var rows='';
 matchList.forEach(function(entry){
  var mid=entry[0],m=entry[1];
  if(!m.players) return;
  var pData=Object.values(m.players).find(function(p){var pn=(p.name||'').toLowerCase().trim();return pn===nLow||pn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim()===nClean;});
  if(!pData) return;
  totalPts+=(pData.pts||0);
  var ptsColCls=(pData.pts||0)>=0?'md-td-pts-pos':'md-td-pts-neg';
  rows+='<tr class="pm-row">'
   +'<td class="pm-td pm-td-match">'+escapeHtml(m.label||mid)+'</td>'
   +'<td class="pm-td pm-td-pts '+ptsColCls+'">'+((pData.pts||0)>=0?'+':'')+pData.pts+'</td>'
   +'<td class="pm-td pm-td-bd">'+((pData.breakdown||'').replace(/\|/g,' | '))+'</td></tr>';
 });

 if(!rows){
  bodyEl.innerHTML='<div class="pm-no-data">No match data for this player yet.</div>';
 } else {
  var totalColCls=totalPts>=0?'md-td-pts-pos':'md-td-pts-neg';
  bodyEl.innerHTML='<div class="pm-season-total"><span class="pm-season-label">Season Total</span><span class="pm-season-val '+totalColCls+'">'+(totalPts>=0?'+':'')+totalPts+'</span></div>'
   +'<div class="md-overflow"><table class="pm-table">'
   +'<thead><tr><th class="pm-th">Match</th><th class="pm-th pm-th-right">Points</th><th class="pm-th">Breakdown</th></tr></thead>'
   +'<tbody>'+rows+'</tbody></table></div>';
 }
 modal.classList.add('open');
};
window.closePlayerModal=function(){var m=document.getElementById('playerModal');if(m)m.classList.remove('open');};

function renderLeaderboardDraft(data){
 const matches=data?.matches||{};
 const matchIds=Object.keys(matches);
 const playerTotal=aggregateMatchPts(matches,'all');
 const teamPts={};
 if(data?.teams) Object.values(data.teams).forEach(t=>{teamPts[t.name]={squadValid:t.squadValid!==false,pts:0,topPlayer:'--',topPts:0,playerCount:0};});

 // Read stored leaderboard totals (permanent, cumulative)
 const storedTotals=data?.leaderboardTotals||{};
 var hasStoredTotals=Object.keys(storedTotals).length>0;

 if(hasStoredTotals){
  // Use stored totals — never changes when teams are rearranged
  Object.entries(storedTotals).forEach(function(e){
   var tn=e[0], st=e[1];
   if(teamPts[tn]){
    teamPts[tn].pts=st.pts||0;
    teamPts[tn].topPlayer=st.topPlayer||'--';
    teamPts[tn].topPts=st.topPts||0;
    teamPts[tn].playerCount=st.playerCount||0;
   }
  });
 } else {
  // Fallback: recalculate from match data (for rooms that haven't been initialized yet)
  const xiMultiplier=parseFloat(data?.xiMultiplier)||1;
  const rosterOwnerMap={};
  if(data?.teams){
  Object.values(data.teams).forEach(team=>{
   const roster=Array.isArray(team.roster)?team.roster:Object.values(team.roster||{});
   roster.forEach(p=>{
    var fn=(p.name||p.n||'').toLowerCase().trim();
    var cn=fn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
    rosterOwnerMap[fn]=team.name;
    rosterOwnerMap[cn]=team.name;
   });
  });
  }
  const currentSnapshots=buildSquadSnapshots(data?.teams);
  matchIds.forEach(mid=>{
  const m=matches[mid];
  if(!m?.players) return;
  var matchSnaps=m.squadSnapshots||currentSnapshots;
  var mXI={}, mBench={};
  Object.entries(matchSnaps).forEach(function(e){
   var tn=e[0], snap=e[1];
   var xiS=new Set(), bnS=new Set();
   (snap.xi||[]).forEach(function(n){var fn=n.toLowerCase().trim();xiS.add(fn);xiS.add(fn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim());});
   (snap.bench||[]).forEach(function(n){var fn=n.toLowerCase().trim();bnS.add(fn);bnS.add(fn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim());});
   mXI[tn]=xiS; mBench[tn]=bnS;
  });
  Object.values(m.players).forEach(p=>{
   const key=(p.name||'').toLowerCase();
   const cleanKey=key.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
   const owner=rosterOwnerMap[key]||rosterOwnerMap[cleanKey]||p.ownedBy||'';
   if(!owner||!teamPts[owner]) return;
   var mult=0;
   if(mXI[owner]&&(mXI[owner].has(key)||mXI[owner].has(cleanKey))) mult=xiMultiplier;
   else if(mBench[owner]&&(mBench[owner].has(key)||mBench[owner].has(cleanKey))) mult=1;
   if(mult>0){
    var mPts=Math.round((p.pts||0)*mult*100)/100;
    teamPts[owner].pts+=mPts;
    if(mPts!==0) teamPts[owner].playerCount++;
    if(mPts>teamPts[owner].topPts){
     teamPts[owner].topPts=mPts;
     var roster2=data.teams[owner]?(Array.isArray(data.teams[owner].roster)?data.teams[owner].roster:Object.values(data.teams[owner].roster||{})):[];
     var found=roster2.find(function(x){return(x.name||x.n||'').toLowerCase().trim()===key;});
     teamPts[owner].topPlayer=found?(found.name||found.n||'--'):key;
    }
   }
  });
  });
 }
 const sorted=Object.entries(teamPts).sort((a,b)=>b[1].pts-a[1].pts);
 const _lbM=document.getElementById('lbMatchesD');
 const _lbP=document.getElementById('lbScoredD');
 const _lbT=document.getElementById('lbTopD');
 const _topPts=sorted.length?sorted[0][1].pts:0;
 if(_lbM) counterUp(_lbM,Object.keys(matches).length);
 if(_lbP) counterUp(_lbP,Object.keys(playerTotal).length);
 if(_lbT) counterUp(_lbT,Math.round(_topPts));

 // ── Podium (top 3) ──
 const podWrap=document.getElementById('lbPodiumWrap');
 if(podWrap){
  const top3=sorted.slice(0,3);
  if(top3.length>=2){
   podWrap.style.display='flex';
   const crowns=['🥇','🥈','🥉'];
   const order=[1,0,2];
   podWrap.innerHTML=order.map(i=>{
    if(!top3[i]) return '';
    const [pn,info]=top3[i];
    const ppts=Math.round(info.pts);
    return `<div class="lb-pod lb-pod--${i+1}"><div class="lb-pod-crown">${crowns[i]}</div><div class="lb-pod-photo">${pn.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()}</div><div class="lb-pod-name">${pn}</div><div class="lb-pod-pts">${ppts>=0?'+':''}${ppts}</div><div class="lb-pod-plinth"></div></div>`;
   }).join('');
  } else { podWrap.style.display='none'; }
 }

 const body=document.getElementById('leaderboardBodyD');if(!body)return;
 if(!sorted.length){body.innerHTML='<div class="empty">No match data yet.</div>';return;}
 const medalClasses=['lb-rank-1','lb-rank-2','lb-rank-3'];

 // Build per-player multiplied contributions for expand panels
 // Only show players who were in the active squad (XI+bench) for at least one match
 const _rosterPts={};
 const _xiMult=parseFloat(data?.xiMultiplier)||1;
 if(data?.teams){
  const _ro={}; // lowercase name -> {owner, displayName}
  const _inSquad={}; // teamName -> Set of displayNames that appeared in any squad
  Object.values(data.teams).forEach(team=>{
   _rosterPts[team.name]={};
   _inSquad[team.name]=new Set();
   const roster=Array.isArray(team.roster)?team.roster:Object.values(team.roster||{});
   roster.forEach(p=>{
    const dn=p.name||p.n||'';
    const fn=dn.toLowerCase().trim();
    const cn=fn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
    _ro[fn]={owner:team.name,dn:dn}; _ro[cn]={owner:team.name,dn:dn};
    _rosterPts[team.name][dn]=0;
   });
  });
  const _csSnaps=buildSquadSnapshots(data?.teams);
  matchIds.forEach(mid=>{
   const m=matches[mid]; if(!m?.players) return;
   const mSnaps=m.squadSnapshots||_csSnaps;
   const mXI={},mBench={};
   Object.entries(mSnaps).forEach(([tn,snap])=>{
    const xiS=new Set(),bnS=new Set();
    (snap.xi||[]).forEach(n=>{const f=n.toLowerCase().trim();xiS.add(f);xiS.add(f.replace(/\*?\s*\([^)]*\)\s*$/,'').trim());});
    (snap.bench||[]).forEach(n=>{const f=n.toLowerCase().trim();bnS.add(f);bnS.add(f.replace(/\*?\s*\([^)]*\)\s*$/,'').trim());});
    mXI[tn]=xiS; mBench[tn]=bnS;
    // Track all squad members for this team
    if(_inSquad[tn]){
     [...xiS,...bnS].forEach(fn=>{const info=_ro[fn];if(info&&info.owner===tn) _inSquad[tn].add(info.dn);});
    }
   });
   Object.values(m.players).forEach(p=>{
    const key=(p.name||'').toLowerCase().trim();
    const ck=key.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
    const info=_ro[key]||_ro[ck]; if(!info) return;
    const owner=info.owner;
    let mult=0;
    if(mXI[owner]&&(mXI[owner].has(key)||mXI[owner].has(ck))) mult=_xiMult;
    else if(mBench[owner]&&(mBench[owner].has(key)||mBench[owner].has(ck))) mult=1;
    if(mult>0) _rosterPts[owner][info.dn]=(_rosterPts[owner][info.dn]||0)+Math.round((p.pts||0)*mult*100)/100;
   });
  });
  // Convert to sorted arrays — only include players who were in at least one squad
  Object.keys(_rosterPts).forEach(tn=>{
   const squad=_inSquad[tn]||new Set();
   _rosterPts[tn]=Object.entries(_rosterPts[tn]).filter(([name])=>squad.has(name)).map(([name,pts])=>({name,pts})).sort((a,b)=>b.pts-a.pts);
  });
 }

 const rows=sorted.map(([name,info],i)=>{
  const rankEl=i<3
   ?`<div class="lb-rank ${medalClasses[i]}">${i+1}</div>`
   :`<div class="lb-rank lb-rank-other">${i+1}</div>`;
  const dq=!info.squadValid;
  const bar=sorted[0][1].pts>0?Math.round((info.pts/sorted[0][1].pts)*100):0;
  const expandId='lbd-exp-'+name.replace(/[^a-zA-Z0-9]/g,'_');
  const expandPlayers=_rosterPts[name]||[];
  const expandHTML=expandPlayers.length?`<div class="lb-expand-inner"><div class="lb-expand-title">Player Points Breakdown</div>`+
   expandPlayers.map(ep=>{
    const ptsCls=ep.pts>0?'lb-prow-pts-pos':ep.pts<0?'lb-prow-pts-neg':'lb-prow-pts-zer';
    return `<div class="lb-prow">${cbzAvatar(ep.name,20)}<span class="lb-prow-name">${ep.name}</span><span class="lb-prow-pts ${ptsCls}">${ep.pts>=0?'+':''}${Math.round(ep.pts)}</span></div>`;
   }).join('')+`</div>`:'';
  const rowHtml=`<div class="lb-row${dq?' lb-row-dq':''}" onclick="window._lbToggleExpand('${expandId}')">${rankEl}<div class="lb-info"><div class="lb-team">${name}${dq?` <span class="lb-dq-badge">DQ</span>`:``}<span class="lb-row-chevron">▼</span></div><div class="lb-meta">Top: ${info.topPlayer} (${info.topPts>=0?'+':''}${info.topPts} pts) · ${info.playerCount} players</div><div class="lb-bar-track"><div class="lb-bar-fill" style="width:${bar}%;"></div></div></div><div class="lb-pts">${dq?'0':((info.pts>=0?'+':'')+info.pts)}</div></div>`;
  const panelHtml=`<div class="lb-expand-panel" id="${expandId}">${expandHTML}</div>`;
  return rowHtml+panelHtml;
 });
 body.innerHTML=rows.join('');
 requestAnimationFrame(()=>{
  body.querySelectorAll('.lb-bar-fill').forEach(el=>{
   const w=el.style.width; el.style.width='0';
   requestAnimationFrame(()=>{ el.style.width=w; });
  });
 });

 // Show All Squads section for super admin / room admin
 var _canView=isAdmin||isSuperAdminEmail(user?.email);
 var _asS=document.getElementById('allSquadsSectionD');
 if(!_asS){
  var _lb=document.getElementById('leaderboard-tab');
  if(_lb){
   _asS=document.createElement('div');
   _asS.id='allSquadsSectionD';
   _asS.style.cssText='margin-top:16px;';
   _asS.innerHTML='<div class="pts-card"><div class="pts-hdr"><span class="pts-title">All Team Squads</span><button class="btn btn-ghost btn-sm" onclick="window.renderAllSquads()">Refresh</button></div><div id="allSquadsBodyD"></div></div>';
   _lb.appendChild(_asS);
  }
 }
 if(_asS) _asS.style.display=_canView?'block':'none';
 if(_canView) window.renderAllSquads();
}

// -- Show All Squads for admin (draft) --
window.renderAllSquads=function(){
 var section=document.getElementById('allSquadsSectionD');
 var body=document.getElementById('allSquadsBodyD');

 if(!body||!draftState||!draftState.teams) return;

 var matches=draftState.matches||{};
 var pts={};
 Object.values(matches).forEach(function(m){
  if(!m.players) return;
  Object.values(m.players).forEach(function(p){
   var k=(p.name||'').toLowerCase();
   pts[k]=(pts[k]||0)+(p.pts||0);
  });
 });

 var html='';
 Object.values(draftState.teams).forEach(function(team){
  var roster=Array.isArray(team.roster)?team.roster:Object.values(team.roster||{});
  if(!roster.length) return;
  var allNames=roster.map(function(p){return p.name||p.n||'';});

  var xi,bench,reserves;
  if(team.activeSquad&&Array.isArray(team.activeSquad)&&team.activeSquad.length>0){
   // activeSquad = xi.concat(bench) — first 11 are XI, rest are Bench
   xi=team.activeSquad.slice(0,11);
   bench=team.activeSquad.slice(11);
   var sqSet=new Set(team.activeSquad.map(function(n){return n.toLowerCase().trim();}));
   reserves=allNames.filter(function(n){return!sqSet.has(n.toLowerCase().trim());});
  } else {
   var xiEnd=Math.min(11,allNames.length);
   var benchEnd=Math.min(xiEnd+5,allNames.length);
   xi=allNames.slice(0,xiEnd);
   bench=allNames.slice(xiEnd,benchEnd);
   reserves=allNames.slice(benchEnd);
  }

  function pRow(name){
   var p=roster.find(function(x){return(x.name||x.n||'')===name;})||{};
   var iplTeam=(p.iplTeam||p.t||'').toUpperCase();
   var role=(p.role||p.r||'');
   var isOs=!!(p.isOverseas||p.o||(name.indexOf('* (')>=0));
   var k=name.toLowerCase().trim();
   var kc=k.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
   var playerPts=pts[k]||pts[kc]||0;
   var ptsCls=playerPts>0?'sq-p-pts-pos':playerPts<0?'sq-p-pts-neg':'sq-p-pts-zero';
   return '<tr><td class="sq-p-name" onclick="window.showPlayerModal(\''+escapeHtml(name)+'\')">'+(isOs?'<span class="sq-p-os-dot">\u25cf</span>':'')+escapeHtml(name)+'</td><td class="sq-p-ipl">'+iplTeam+'</td><td class="sq-p-role">'+role+'</td><td class="sq-p-pts '+ptsCls+'">'+(playerPts>=0?'+':'')+playerPts+'</td></tr>';
  }

  var teamTotal=0;
  xi.concat(bench).forEach(function(n){
   var k=n.toLowerCase().trim();
   var kc=k.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
   teamTotal+=(pts[k]||pts[kc]||0);
  });

  html+='<div class="sq-card">';
  html+='<div class="sq-card-hdr"><strong class="sq-card-name">'+team.name+'</strong><span class="sq-card-pts">'+(teamTotal>=0?'+':'')+teamTotal+'</span></div>';
  html+='<table class="sq-table">';
  html+='<tr><td colspan="4" class="sq-section-hdr sq-section-xi">Playing XI ('+xi.length+')</td></tr>';
  xi.forEach(function(n){html+=pRow(n);});
  html+='<tr><td colspan="4" class="sq-section-hdr sq-section-bench">Bench ('+bench.length+')</td></tr>';
  bench.forEach(function(n){html+=pRow(n);});
  if(reserves.length){
   html+='<tr><td colspan="4" class="sq-section-hdr sq-section-reserves">Reserves ('+reserves.length+')</td></tr>';
   reserves.forEach(function(n){html+=pRow(n);});
  }
  html+='</table></div>';
 });

 body.innerHTML=html||'<div class="empty">No teams found.</div>';
};

// -- Compute a single match's contribution to each team (used for push + recalc) --
function computeMatchContribution(matchData, matchSnaps, teamsData, xiMultiplier){
 var contrib={}; // teamName -> {pts, players: {cleanName: pts}}
 if(!matchData?.players) return contrib;
 var hasStoredSnaps=!!matchData.squadSnapshots;
 var rosterOwnerMap={};
 if(teamsData){
  Object.values(teamsData).forEach(function(t){
   var roster=Array.isArray(t.roster)?t.roster:(t.roster?Object.values(t.roster):[]);
   roster.forEach(function(p){
    var fn=(p.name||p.n||'').toLowerCase().trim();
    var cn=fn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
    rosterOwnerMap[fn]=t.name;
    rosterOwnerMap[cn]=t.name;
   });
  });
 }
 var mXI={}, mBench={};
 Object.entries(matchSnaps||{}).forEach(function(e){
  var tn=e[0], snap=e[1];
  var xiS=new Set(), bnS=new Set();
  (snap.xi||[]).forEach(function(n){var fn=n.toLowerCase().trim();xiS.add(fn);xiS.add(fn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim());});
  (snap.bench||[]).forEach(function(n){var fn=n.toLowerCase().trim();bnS.add(fn);bnS.add(fn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim());});
  mXI[tn]=xiS; mBench[tn]=bnS;
 });
 Object.values(matchData.players).forEach(function(p){
  var key=(p.name||'').toLowerCase();
  var cleanKey=key.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
  var owner=rosterOwnerMap[key]||rosterOwnerMap[cleanKey]||p.ownedBy||'';
  if(!owner) return;
  var mult=0;
  if(mXI[owner]&&(mXI[owner].has(key)||mXI[owner].has(cleanKey))) mult=xiMultiplier;
  else if(mBench[owner]&&(mBench[owner].has(key)||mBench[owner].has(cleanKey))) mult=1;
  // Fallback: if no stored snapshots and player has ownedBy but isn't in current squad
  // (e.g., player was released/traded after this match), still count their points at 1x
  if(mult===0&&!hasStoredSnaps&&owner&&(p.ownedBy||rosterOwnerMap[key]||rosterOwnerMap[cleanKey])){
   mult=1;
  }
  if(mult>0){
   var mPts=Math.round((p.pts||0)*mult*100)/100;
   if(!contrib[owner]) contrib[owner]={pts:0,players:{}};
   contrib[owner].pts+=mPts;
   contrib[owner].players[cleanKey]=(contrib[owner].players[cleanKey]||0)+mPts;
  }
 });
 return contrib;
}

// -- Recalculate leaderboard totals from all matches (admin tool) --
window.recalcLeaderboardD=async function(){
 if(!draftId||!draftState) return;
 if(!confirm('Recalculate leaderboard totals from all match data? This will overwrite current stored totals.')) return;
 window.showAlert('Recalculating...','info');
 var matches=draftState.matches||{};
 var teams=draftState.teams||{};
 var xiMult=parseFloat(draftState.xiMultiplier)||1;
 var currentSnaps=buildSquadSnapshots(teams);
 var totals={}; // teamName -> {pts, topPlayer, topPts, playerCount}
 // Initialize all teams
 Object.values(teams).forEach(function(t){
  totals[t.name]={pts:0,topPlayer:'--',topPts:0,playerCount:0,_players:{}};
 });
 // Sum across all matches
 Object.entries(matches).forEach(function(me){
  var mid=me[0], m=me[1];
  var matchSnaps=m.squadSnapshots||currentSnaps;
  var contrib=computeMatchContribution(m, matchSnaps, teams, xiMult);
  Object.entries(contrib).forEach(function(ce){
   var tn=ce[0], c=ce[1];
   if(!totals[tn]) totals[tn]={pts:0,topPlayer:'--',topPts:0,playerCount:0,_players:{}};
   totals[tn].pts+=c.pts;
   Object.entries(c.players).forEach(function(pe){
    totals[tn]._players[pe[0]]=(totals[tn]._players[pe[0]]||0)+pe[1];
   });
  });
 });
 // Compute topPlayer and playerCount from aggregated player data
 var toStore={};
 Object.entries(totals).forEach(function(te){
  var tn=te[0], t=te[1];
  var topP='--', topPts=0, pCount=0;
  Object.entries(t._players).forEach(function(pe){
   if(pe[1]!==0) pCount++;
   if(pe[1]>topPts){topPts=pe[1];topP=pe[0];}
  });
  // Find display name for topPlayer
  if(teams[tn]){
   var roster=Array.isArray(teams[tn].roster)?teams[tn].roster:(teams[tn].roster?Object.values(teams[tn].roster):[]);
   var found=roster.find(function(x){return(x.name||x.n||'').toLowerCase().trim().replace(/\*?\s*\([^)]*\)\s*$/,'').trim()===topP;});
   if(found) topP=found.name||found.n||topP;
  }
  toStore[tn]={pts:Math.round(t.pts*100)/100,topPlayer:topP,topPts:Math.round(topPts*100)/100,playerCount:pCount};
 });
 try{
  await set(ref(db,'drafts/'+draftId+'/leaderboardTotals'),toStore);
  window.showAlert('Leaderboard totals recalculated and saved.','ok');
 }catch(e){
  window.showAlert('Failed: '+e.message);
 }
};

function renderAnalyticsDraft(data){
 if(!data) return;
 const matches=data.matches||{};
 // ── Aggregate per-player stats from all matches ──
 const playerTotal={};
 Object.values(matches).forEach(m=>{
  if(!m?.players) return;
  Object.values(m.players).forEach(p=>{
   const key=(p.name||'').toLowerCase();
   if(!playerTotal[key]) playerTotal[key]={name:p.name,pts:0,runs:0,balls:0,fours:0,sixes:0,wkts:0,overs:0,bowlRuns:0,ecoStored:0,ecoCount:0,catches:0,stumpings:0,runouts:0,matchCount:0,highScore:0,hundreds:0,fifties:0,nineties:0,fiveWkts:0,threeWkts:0,inns:0,bowlInns:0};
   const s=playerTotal[key]; s.pts+=(p.pts||0); s.matchCount++;
   const bd=p.breakdown||'';
   const batM=bd.match(/Bat(?:ting)?\((\d+)r\s+([\d.]+)b(?:\s+(\d+)[x\u00d7]4)?(?:\s+(\d+)[x\u00d7]6)?/);
   if(batM){
    const r=+batM[1]; s.runs+=r; s.balls+=+batM[2]; s.fours+=+(batM[3]||0); s.sixes+=+(batM[4]||0); s.inns++;
    if(r>s.highScore) s.highScore=r;
    if(r>=100) s.hundreds++;
    else if(r>=90) s.nineties++;
    if(r>=50&&r<100) s.fifties++;
   }
   const bowM=bd.match(/Bowl(?:ing)?\((\d+)w\s+([\d.]+)ov(?:\s+(\d+)r)?[^)]*\)/);
   if(bowM){
    const w=+bowM[1]; const ov=+bowM[2]; s.wkts+=w; s.overs+=ov; s.bowlInns++;
    if(w>=5) s.fiveWkts++;
    if(w>=3) s.threeWkts++;
    const ecoM=bd.match(/eco:([\d.]+)/);
    let runsFromBreakdown=bowM[3]?+bowM[3]:null;
    if(runsFromBreakdown===null&&ecoM&&+ecoM[1]>0&&ov>0){
     runsFromBreakdown=Math.round(+ecoM[1]*normalizeOvers(ov));
    }
    s.bowlRuns+=(runsFromBreakdown||0);
    if(ecoM&&+ecoM[1]>0){s.ecoStored+=+ecoM[1];s.ecoCount++;}
   }
   const fldM=bd.match(/Field(?:ing)?\((\d+)c\s+(\d+)st\s+(\d+)ro\)/);
   if(fldM){s.catches+=+fldM[1];s.stumpings+=+fldM[2];s.runouts+=+fldM[3];}
  });
 });
 // ── Metadata ──
 const meta={};
 if(data.players) Object.values(data.players).forEach(p=>{meta[(p.name||p.n||'').toLowerCase()]={role:p.role||p.r||'',team:p.iplTeam||p.t||''};});
 const ownerMap={};
 if(data.teams) Object.values(data.teams).forEach(team=>{
  const roster=Array.isArray(team.roster)?team.roster:Object.values(team.roster||{});
  roster.forEach(p=>{ownerMap[(p.name||p.n||'').toLowerCase()]=team.name;});
 });
 const all=Object.values(playerTotal);
 const byRole=role=>all.filter(p=>(meta[p.name.toLowerCase()]?.role||'').toLowerCase().includes(role.toLowerCase()));

 // ── Stat definitions ──
 const CATS=[
  {id:'points',label:'⭐ Points',subs:[
   {id:'pts-all',label:'Overall',filter:()=>true,sort:(a,b)=>b.pts-a.pts,need:p=>true,
    cols:['#','Player','Owner','Pts','Runs','Wkts'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',(p.pts>=0?'+':'')+p.pts,p.runs||'--',p.wkts||'--']),
    colR:[0,0,0,1,1,1]},
   {id:'pts-bat',label:'Top Batters',filter:p=>(meta[p.name.toLowerCase()]?.role||'').toLowerCase().includes('batter'),sort:(a,b)=>b.pts-a.pts,need:p=>p.pts>0,
    cols:['#','Player','Owner','Pts','Runs'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',(p.pts>=0?'+':'')+p.pts,p.runs]),
    colR:[0,0,0,1,1]},
   {id:'pts-bowl',label:'Top Bowlers',filter:p=>(meta[p.name.toLowerCase()]?.role||'').toLowerCase().includes('bowler'),sort:(a,b)=>b.pts-a.pts,need:p=>p.pts>0,
    cols:['#','Player','Owner','Pts','Wkts'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',(p.pts>=0?'+':'')+p.pts,p.wkts]),
    colR:[0,0,0,1,1]},
   {id:'pts-ar',label:'All-Rounders',filter:p=>(meta[p.name.toLowerCase()]?.role||'').toLowerCase().includes('all'),sort:(a,b)=>b.pts-a.pts,need:p=>p.pts>0,
    cols:['#','Player','Owner','Pts','Runs','Wkts'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',(p.pts>=0?'+':'')+p.pts,p.runs,p.wkts]),
    colR:[0,0,0,1,1,1]},
   {id:'pts-wk',label:'Wicketkeepers',filter:p=>(meta[p.name.toLowerCase()]?.role||'').toLowerCase().includes('wicketkeeper'),sort:(a,b)=>b.pts-a.pts,need:p=>p.pts>0,
    cols:['#','Player','Owner','Pts','Runs','Catches'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',(p.pts>=0?'+':'')+p.pts,p.runs,p.catches]),
    colR:[0,0,0,1,1,1]},
  ]},
  {id:'batting',label:'🏏 Batting',subs:[
   {id:'bat-runs',label:'Most Runs',filter:()=>true,sort:(a,b)=>b.runs-a.runs,need:p=>p.runs>0,
    cols:['#','Player','Owner','Runs','Balls','SR','4s','6s'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.runs,p.balls,p.balls>0?((p.runs/p.balls)*100).toFixed(1):'--',p.fours,p.sixes]),
    colR:[0,0,0,1,1,1,1,1]},
   {id:'bat-hs',label:'Highest Score',filter:()=>true,sort:(a,b)=>b.highScore-a.highScore,need:p=>p.highScore>0,
    cols:['#','Player','Owner','HS','Runs','Inns'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.highScore,p.runs,p.inns]),
    colR:[0,0,0,1,1,1]},
   {id:'bat-sr',label:'Best Strike Rate',filter:()=>true,sort:(a,b)=>(b.balls>0?b.runs/b.balls:0)-(a.balls>0?a.runs/a.balls:0),need:p=>p.balls>=30,
    cols:['#','Player','Owner','SR','Runs','Balls'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.balls>0?((p.runs/p.balls)*100).toFixed(1):'--',p.runs,p.balls]),
    colR:[0,0,0,1,1,1]},
   {id:'bat-100',label:'Most Hundreds',filter:()=>true,sort:(a,b)=>b.hundreds-a.hundreds,need:p=>p.hundreds>0,
    cols:['#','Player','Owner','100s','Runs','HS'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.hundreds,p.runs,p.highScore]),
    colR:[0,0,0,1,1,1]},
   {id:'bat-50',label:'Most Fifties',filter:()=>true,sort:(a,b)=>b.fifties-a.fifties,need:p=>p.fifties>0,
    cols:['#','Player','Owner','50s','Runs','Inns'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.fifties,p.runs,p.inns]),
    colR:[0,0,0,1,1,1]},
   {id:'bat-90',label:'Most Nineties',filter:()=>true,sort:(a,b)=>b.nineties-a.nineties,need:p=>p.nineties>0,
    cols:['#','Player','Owner','90s','HS','Runs'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.nineties,p.highScore,p.runs]),
    colR:[0,0,0,1,1,1]},
   {id:'bat-4s',label:'Most Fours',filter:()=>true,sort:(a,b)=>b.fours-a.fours,need:p=>p.fours>0,
    cols:['#','Player','Owner','4s','Runs','Inns'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.fours,p.runs,p.inns]),
    colR:[0,0,0,1,1,1]},
   {id:'bat-6s',label:'Most Sixes',filter:()=>true,sort:(a,b)=>b.sixes-a.sixes,need:p=>p.sixes>0,
    cols:['#','Player','Owner','6s','Runs','SR'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.sixes,p.runs,p.balls>0?((p.runs/p.balls)*100).toFixed(1):'--']),
    colR:[0,0,0,1,1,1]},
  ]},
  {id:'bowling',label:'🎯 Bowling',subs:[
   {id:'bowl-wkts',label:'Most Wickets',filter:()=>true,sort:(a,b)=>b.wkts-a.wkts,need:p=>p.wkts>0,
    cols:['#','Player','Owner','Wkts','Overs','Eco','5W'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.wkts,p.overs,p.overs>0?(p.bowlRuns/normalizeOvers(p.overs)).toFixed(2):'--',p.fiveWkts||'--']),
    colR:[0,0,0,1,1,1,1]},
   {id:'bowl-eco',label:'Best Economy (min 6 overs)',filter:()=>true,sort:(a,b)=>{const ea=a.overs>=6?a.bowlRuns/normalizeOvers(a.overs):99;const eb=b.overs>=6?b.bowlRuns/normalizeOvers(b.overs):99;return ea-eb;},need:p=>p.overs>=6,
    cols:['#','Player','Owner','Eco','Overs','Wkts','Runs'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.overs>0?(p.bowlRuns/normalizeOvers(p.overs)).toFixed(2):'--',p.overs,p.wkts,p.bowlRuns]),
    colR:[0,0,0,1,1,1,1]},
   {id:'bowl-5w',label:'Most 5-Wicket Hauls',filter:()=>true,sort:(a,b)=>b.fiveWkts-a.fiveWkts,need:p=>p.fiveWkts>0,
    cols:['#','Player','Owner','5W','Wkts','Overs'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.fiveWkts,p.wkts,p.overs]),
    colR:[0,0,0,1,1,1]},
   {id:'bowl-3w',label:'Most 3-Wicket Hauls',filter:()=>true,sort:(a,b)=>b.threeWkts-a.threeWkts,need:p=>p.threeWkts>0,
    cols:['#','Player','Owner','3W','Wkts','Overs'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.threeWkts,p.wkts,p.overs]),
    colR:[0,0,0,1,1,1]},
  ]},
  {id:'fielding',label:'🧤 Fielding',subs:[
   {id:'fld-dis',label:'Most Dismissals',filter:()=>true,sort:(a,b)=>(b.catches+b.stumpings+b.runouts)-(a.catches+a.stumpings+a.runouts),need:p=>(p.catches+p.stumpings+p.runouts)>0,
    cols:['#','Player','Owner','Dis','Catches','St','RO'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.catches+p.stumpings+p.runouts,p.catches,p.stumpings,p.runouts]),
    colR:[0,0,0,1,1,1,1]},
   {id:'fld-c',label:'Most Catches',filter:()=>true,sort:(a,b)=>b.catches-a.catches,need:p=>p.catches>0,
    cols:['#','Player','Owner','Catches','Pts'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.catches,(p.pts>=0?'+':'')+p.pts]),
    colR:[0,0,0,1,1]},
   {id:'fld-ro',label:'Most Run-outs',filter:()=>true,sort:(a,b)=>b.runouts-a.runouts,need:p=>p.runouts>0,
    cols:['#','Player','Owner','RO','Pts'],
    row:p=>([ownerMap[p.name.toLowerCase()]||'--',p.runouts,(p.pts>=0?'+':'')+p.pts]),
    colR:[0,0,0,1,1]},
  ]},
 ];

 // ── State ──
 let activeSub=CATS[0].subs[0].id;
 const sidebar=document.getElementById('anSidebarD');
 const grid=document.getElementById('analyticsGridD');
 const titleEl=document.getElementById('anTitleD');
 const searchEl=document.getElementById('anSearchD');
 if(!grid) return;

 function renderSidebar(){
  sidebar.innerHTML=CATS.map(cat=>{
   const isOpen=cat.subs.some(s=>s.id===activeSub);
   return `<button class="an-cat-btn${isOpen?' an-cat-open':''}" data-cat="${cat.id}"><span>${cat.label}</span><span class="an-cat-arrow">▶</span></button>`+
   `<div class="an-cat-subs">${cat.subs.map(s=>`<button class="an-sub-btn${s.id===activeSub?' an-sub-active':''}" data-sub="${s.id}">${s.label}</button>`).join('')}</div>`;
  }).join('');
  sidebar.querySelectorAll('.an-cat-btn').forEach(btn=>{
   btn.onclick=()=>{
    const wasOpen=btn.classList.contains('an-cat-open');
    sidebar.querySelectorAll('.an-cat-btn').forEach(b=>b.classList.remove('an-cat-open'));
    if(!wasOpen) btn.classList.toggle('an-cat-open');
   };
  });
  sidebar.querySelectorAll('.an-sub-btn').forEach(btn=>{
   btn.onclick=()=>{activeSub=btn.dataset.sub;renderSidebar();renderTable();};
  });
 }

 // Ownership filter dropdown
 var _anFilterElD=document.getElementById('anOwnerFilterD');
 if(!_anFilterElD){
  var _anCtrlD=searchEl?.parentElement;
  if(_anCtrlD){
   _anFilterElD=document.createElement('select');
   _anFilterElD.id='anOwnerFilterD';
   _anFilterElD.className='form-select';
   _anFilterElD.style.cssText='width:auto;min-width:140px;margin-left:8px;padding:6px 10px;border-radius:8px;background:var(--surface);color:var(--txt);border:1px solid var(--border);font-size:13px;';
   _anFilterElD.innerHTML='<option value="all">All Players</option><option value="owned">Owned Only</option>';
   _anFilterElD.onchange=function(){renderTable();};
   _anCtrlD.appendChild(_anFilterElD);
  }
 }

 function renderTable(){
  let sub=null;
  for(const cat of CATS) for(const s of cat.subs) if(s.id===activeSub){sub=s;break;}
  if(!sub){grid.innerHTML='<div class="an-empty">Select a stat from the sidebar</div>';return;}
  titleEl.textContent=sub.label;
  const q=(searchEl?.value||'').toLowerCase().trim();
  const ownerFilterVal=document.getElementById('anOwnerFilterD')?.value||'all';
  let rows=all.filter(sub.filter).filter(sub.need).sort(sub.sort);
  if(ownerFilterVal==='owned') rows=rows.filter(p=>!!ownerMap[p.name.toLowerCase()]);
  if(q) rows=rows.filter(p=>p.name.toLowerCase().includes(q)||(ownerMap[p.name.toLowerCase()]||'').toLowerCase().includes(q));
  if(!rows.length){grid.innerHTML='<div class="an-empty">No data'+(q?' matching "'+q+'"':'')+'</div>';return;}
  const hdr=sub.cols.map((c,i)=>`<th${sub.colR[i]?' class="an-th-r"':''}>${c}</th>`).join('');
  const body=rows.map((p,i)=>{
   const vals=sub.row(p);
   const topCls=i===0?' an-top1':i===1?' an-top2':i===2?' an-top3':'';
   return `<tr class="${topCls}"><td class="an-td-idx">${i+1}</td><td class="an-td-name" onclick="window.showPlayerModal('${escapeHtml(p.name)}')">${cbzAvatar(p.name,22)}${escapeHtml(p.name)}</td>`+
    vals.map((v,vi)=>{
     const cls=vi===0?'an-td-owner':vi===1?'an-td-stat':'an-td-num';
     return `<td class="${cls}">${v}</td>`;
    }).join('')+`</tr>`;
  }).join('');
  grid.innerHTML=`<table class="an-tbl"><thead><tr>${hdr}</tr></thead><tbody>${body}</tbody></table>`;
 }

 renderSidebar();
 renderTable();
 // Search handler
 if(searchEl){
  searchEl.oninput=()=>renderTable();
 }
}

window.downloadPointsCSVDraft=function(){
 if(!draftState?.matches){window.showAlert('No match data yet.','err');return;}
 const totals=aggregateMatchPts(draftState.matches,'all');
 const ownerMap=getOwnerMapDraft(draftState);
 const rows=Object.values(totals).sort((a,b)=>b.pts-a.pts).map((p,i)=>[i+1,`"${p.name}"`,ownerMap[p.name.toLowerCase()]||'Unowned',p.matchCount,p.pts]);
 const csv=['#,Player,Owner,Matches,Points',...rows.map(r=>r.join(','))].join('\n');
 const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
 a.download=`draft_points.csv`;a.click();window.showAlert('CSV downloaded!','ok');
};

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// GEMINI SCORECARD PARSER -- DRAFT APP (Firebase AI Logic)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

let scImageFilesD=[];

window.handleScFilesD=function(files){
 if(!files||!files.length) return;
 scImageFilesD=[...scImageFilesD,...Array.from(files)].slice(0,4);
 renderThumbsD();
};

function renderThumbsD(){
 const row=document.getElementById('scThumbRowD');
 if(!row) return;
 row.innerHTML='';
 scImageFilesD.forEach((file,i)=>{
 const url=URL.createObjectURL(file);
 const wrap=document.createElement('div');
 wrap.style.cssText='position:relative;display:inline-block;';
 const img=document.createElement('img');
 img.src=url;img.style.cssText='height:72px;width:auto;border-radius:6px;border:1px solid var(--b1);object-fit:cover;display:block;';
 const del=document.createElement('button');
 del.textContent='x';
 del.style.cssText='position:absolute;top:-6px;right:-6px;background:var(--err);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:.65rem;cursor:pointer;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;';
 del.onclick=()=>{scImageFilesD.splice(i,1);renderThumbsD();};
 wrap.appendChild(img);wrap.appendChild(del);
 row.appendChild(wrap);
 });
 const hint=document.getElementById('scDropHintD');
 if(hint) hint.textContent=scImageFilesD.length?`${scImageFilesD.length} file${scImageFilesD.length>1?'s':''} loaded -- add more or parse`:'PNG . JPG . WEBP . up to 4 files';
}

const SCORECARD_PROMPT_D=`You are a professional cricket scorecard parser.
Extract ALL batting, bowling, and fielding data from ALL innings shown in the images.
Return ONLY a valid JSON object -- no markdown, no explanation, no code fences.

Structure:
{"matchLabel":"Team A vs Team B - Date","winner":"SHORT_CODE","motm":"Player or empty","result":"normal|noresult|superover",
"batting":[{"name":"","runs":0,"balls":0,"fours":0,"sixes":0,"dismissal":"out|notout|duck"}],
"bowling":[{"name":"","overs":0.0,"economy":0.00,"runs":0,"wickets":0,"dots":0,"maidens":0}],
"fielding":[{"name":"","catches":0,"stumpings":0,"runouts":0}]}

CRITICAL -- DOT BALLS: If no "0s" column visible: dots = floor(overs*6) - runs_conceded (min 0). Never leave as 0 for bowlers who bowled multiple overs.
CRITICAL -- FOURS: Extract from "4s" column. If not visible: fours = max(0, floor((runs - sixes*6) / 4)).
Rules: ALL players from BOTH innings. Duck=out for 0. Extract fielders from dismissal text. Return ONLY the JSON.`;
// Aliases used by global scorecard parser (which uses auction function names)
const SCORECARD_SYSTEM_PROMPT=SCORECARD_PROMPT_D;
function calcBattingPoints(runs,balls,fours,sixes,dismissal,isWin,isMot,playerRole){ return calcBattingPtsD(runs,balls,fours,sixes,dismissal,isWin,isMot,playerRole); }
function calcBowlingPoints(overs,runs,wkts,dots,maidens,isWin,isMot){ return calcBowlingPtsD(overs,runs,wkts,dots,maidens,isWin,isMot); }
function calcFieldingPoints(catches,stumpings,runouts,isWin,isMot){ return calcFieldingPtsD(catches,stumpings,runouts,isWin,isMot); }

window.parseWithGeminiD=async function(){
 const statusEl=document.getElementById('aiStatusD');
 const btn=document.getElementById('geminiParseBtnD');
 if(!scImageFilesD.length){
 statusEl.className='ai-status fail';
 statusEl.textContent='Upload at least one screenshot first.';
 return;
 }
 statusEl.className='ai-status parsing';
 statusEl.textContent=' Gemini is reading the scorecard...';
 btn.disabled=true;btn.textContent='Parsing...';
 try{
 const imageParts=await Promise.all(scImageFilesD.map(file=>new Promise((res,rej)=>{
 const reader=new FileReader();
 reader.onload=e=>res({inlineData:{data:e.target.result.split(',')[1],mimeType:file.type||'image/png'}});
 reader.onerror=rej;
 reader.readAsDataURL(file);
 })));
 const result=await getGeminiModel().generateContent({
 systemInstruction:SCORECARD_PROMPT_D,
 contents:[{role:'user',parts:[...imageParts,{text:`Parse ${scImageFilesD.length>1?'these '+scImageFilesD.length+' screenshots':'this screenshot'} and return JSON.`}]}]
 });
 const raw=result.response.text();
 const clean=raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
 const m=clean.match(/\{[\s\S]*\}/);
 if(!m) throw new Error('No valid JSON returned. Try clearer screenshots.');
 const parsed=JSON.parse(m[0]);
 populateDraftFormFromAI(parsed);
 statusEl.className='ai-status done';
 statusEl.textContent=`Parsed: ${parsed.batting?.length||0} batters . ${parsed.bowling?.length||0} bowlers . ${parsed.fielding?.length||0} fielders. Review and save.`;
 const lbl=document.getElementById('matchLabelD');
 if(lbl&&!lbl.value&&parsed.matchLabel) lbl.value=parsed.matchLabel;
 document.getElementById('matchFormBodyD').style.display='block';
 }catch(e){
 statusEl.className='ai-status fail';
 statusEl.textContent=`\u274c ${e.message}`;
 }finally{
 btn.disabled=false;btn.textContent=' Parse with Gemini';
 }
};

// Fallback JSON import
window.importFromJsonD=function(){
 const statusEl=document.getElementById('aiStatusD');
 const raw=(document.getElementById('scJsonInputD')?.value||'').trim();
 if(!raw){statusEl.className='ai-status fail';statusEl.textContent='Paste JSON first.';return;}
 let parsed;
 try{const m=raw.match(/\{[\s\S]*\}/);if(!m)throw new Error('No JSON');parsed=JSON.parse(m[0]);}
 catch(e){statusEl.className='ai-status fail';statusEl.textContent='\u274c Invalid JSON.';return;}
 populateDraftFormFromAI(parsed);
 statusEl.className='ai-status done';
 statusEl.textContent=`Imported: ${parsed.batting?.length||0} batters . ${parsed.bowling?.length||0} bowlers . ${parsed.fielding?.length||0} fielders.`;
};


function populateDraftFormFromAI(parsed){
 if(parsed.matchLabel) document.getElementById('matchLabelD').value=parsed.matchLabel;
 if(parsed.winner) document.getElementById('mfWinnerD').value=parsed.winner;
 if(parsed.motm) document.getElementById('mfMotmD').value=parsed.motm;
 if(parsed.result){
 const sel=document.getElementById('mfResultD');
 if(sel)[...sel.options].forEach(o=>{if(o.value===parsed.result)o.selected=true;});
 }
 document.getElementById('battingRowsD').innerHTML='';
 document.getElementById('bowlingRowsD').innerHTML='';
 document.getElementById('fieldingRowsD').innerHTML='';
 brD=0;bowD=0;fldD=0;
 document.getElementById('matchFormBodyD').style.display='block';

 (parsed.batting||[]).forEach(b=>{
 window.addBattingRowD();
 const id=`brd${brD-1}`;
 document.getElementById(`${id}n`).value=b.name||'';
 document.getElementById(`${id}r`).value=b.runs??'';
 document.getElementById(`${id}b`).value=b.balls??'';
 document.getElementById(`${id}f`).value=b.fours??'';
 document.getElementById(`${id}s`).value=b.sixes??'';
 const dis=document.getElementById(`${id}dis`);
 if(dis)[...dis.options].forEach(o=>{if(o.value===(b.dismissal||'out'))o.selected=true;});
 });
 (parsed.bowling||[]).forEach(b=>{
 window.addBowlingRowD();
 const id=`bowd${bowD-1}`;
 document.getElementById(`${id}n`).value=b.name||'';
 document.getElementById(`${id}o`).value=b.overs??'';
 document.getElementById(`${id}r`).value=b.runs??'';
 document.getElementById(`${id}w`).value=b.wickets??'';
 document.getElementById(`${id}d`).value=b.dots??'';
 document.getElementById(`${id}m`).value=b.maidens??'';
 const _ov=parseFloat(b.overs)||0,_r=parseFloat(b.runs)||0;
 const _eco=parseFloat(b.economy||b.econ||b.economyRate||0)||(_ov>0?_r/normalizeOvers(_ov):0);
 const ecoEl=document.getElementById(`${id}e`);
 if(ecoEl&&_eco>0) ecoEl.value=_eco.toFixed(2);
 });
 const fm={};
 (parsed.fielding||[]).forEach(f=>{if((f.catches||0)+(f.stumpings||0)+(f.runouts||0)>0)fm[f.name]=f;});
 Object.values(fm).forEach(f=>{
 window.addFieldingRowD();
 const id=`fldd${fldD-1}`;
 document.getElementById(`${id}n`).value=f.name||'';
 document.getElementById(`${id}c`).value=f.catches||'';
 document.getElementById(`${id}st`).value=f.stumpings||'';
 document.getElementById(`${id}ro`).value=f.runouts||'';
 });
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// MATCH DATA TAB -- DRAFT (view + edit + delete)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

const expandedMatchesDraft=new Set();

function renderMatchDataDraft(data){
 const container=document.getElementById('matchDataListD');
 if(!container) return;
 const matches=data?.matches||{};
 const matchIds=Object.keys(matches).sort((a,b)=>(matches[b].timestamp||0)-(matches[a].timestamp||0));
 if(!matchIds.length){container.innerHTML='<div class="empty">No matches recorded yet. Use the Points tab to add match data.</div>';return;}

 // Lookup IPL team for player name
 function getIplTeam(name){
  const nLow=(name||'').toLowerCase().trim();
  const nClean=nLow.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
  if(cachedPlayers){
   const f=cachedPlayers.find(p=>{const pn=(p.name||p.n||'').toLowerCase().trim();return pn===nLow||pn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim()===nClean;});
   if(f) return (f.iplTeam||f.t||'').toUpperCase();
  }
  const rd=RAW.find(p=>{const pn=(p.n||'').toLowerCase().trim();return pn===nLow||pn.replace(/\*?\s*\([^)]*\)\s*$/,'').trim()===nClean;});
  return rd?(rd.t||'').toUpperCase():'';
 }

 container.innerHTML=matchIds.map(mid=>{
  const m=matches[mid];
  const players=m.players?Object.entries(m.players):[];
  const resultLabel=m.result==='noresult'?'No Result':m.result==='superover'?'Super Over':'Completed';
  const isOpen=expandedMatchesDraft.has(mid);
  const batters=[],bowlers=[],fielders=[];
  players.forEach(([pkey,p])=>{
   const bd=p.breakdown||'';
   const team=p.iplTeam||(getIplTeam(p.name));
   const batM=bd.match(/Bat(?:ting)?\((\d+)r\s+([\d.]+)b(?:\s+(\d+)[x\u00d7]4)?(?:\s+(\d+)[x\u00d7]6)?/);
   if(batM) batters.push({name:p.name,team,runs:+batM[1],balls:+batM[2],fours:+(batM[3]||0),sixes:+(batM[4]||0),duck:bd.includes('DUCK'),pts:p.pts});
   const bowM=bd.match(/Bowl(?:ing)?\((\d+)w\s+([\d.]+)ov(?:\s+(\d+)r)?/);
   if(bowM){
    // Fallback: global scorecards store "Bowl(2w 4ov eco:5.00)" without
    // explicit runs — derive runs from eco so the Eco column isn't 0.00.
    const _ov=+bowM[2];
    let _r=bowM[3]?+bowM[3]:null;
    if(_r===null){
     const _ecoM=bd.match(/eco:([\d.]+)/);
     if(_ecoM && +_ecoM[1]>0 && _ov>0) _r=Math.round(+_ecoM[1]*_ov);
    }
    bowlers.push({name:p.name,team,wkts:+bowM[1],overs:_ov,runs:_r||0,pts:p.pts});
   }
   const fldM=bd.match(/Field(?:ing)?\((\d+)c\s+(\d+)st\s+(\d+)ro\)/);
   if(fldM&&(+fldM[1]||+fldM[2]||+fldM[3])) fielders.push({name:p.name,team,catches:+fldM[1],stumpings:+fldM[2],runouts:+fldM[3],pts:p.pts});
  });

  // Determine the two teams from player data
  const teamSet=new Set([...batters,...bowlers,...fielders].map(p=>p.team).filter(Boolean));
  const teams=[...teamSet];
  const team1=teams[0]||'Team 1';
  const team2=teams[1]||'Team 2';
  const isTeam1=t=>t===team1;

  const allPts=[...Object.values(m.players||{})].sort((a,b)=>(b.pts||0)-(a.pts||0));
  const sr=p=>p.balls>0?((p.runs/p.balls)*100).toFixed(0):'--';
  const eco=p=>p.overs>0?(p.runs/normalizeOvers(p.overs)).toFixed(2):'--';

  // Styles via CSS classes
  const ptsCls=pts=>pts>0?'md-td-pts-pos':pts<0?'md-td-pts-neg':'md-td-pts-zero';

  function teamSec(label,teamCode){
   return `<div class="md-team-sec md-team-sec-${teamCode}">${label}</div>`;
  }

  function batTable(arr){
   if(!arr.length) return '<div class="md-no-data">No batting data</div>';
   return `<div class="md-overflow"><table class="md-table"><thead><tr>
    <th class="md-th md-th-left">Player</th><th class="md-th md-th-right">R</th><th class="md-th md-th-right">B</th><th class="md-th md-th-right">4s</th><th class="md-th md-th-right">6s</th><th class="md-th md-th-right">SR</th><th class="md-th md-th-right">Pts</th>
   </tr></thead><tbody>${arr.sort((a,b)=>b.runs-a.runs).map(p=>`<tr>
    <td class="md-td md-td-name" onclick="window.showPlayerModal('${escapeHtml(p.name)}')">${escapeHtml(p.name)}${p.duck?'&nbsp;<span class="md-duck-badge">DUCK</span>':''}</td>
    <td class="md-td md-td-num-bold">${p.runs}</td><td class="md-td md-td-num">${p.balls}</td><td class="md-td md-td-num">${p.fours}</td><td class="md-td md-td-num">${p.sixes}</td><td class="md-td md-td-num">${sr(p)}</td><td class="md-td md-td-pts ${ptsCls(p.pts)}">${p.pts>0?'+':''}${p.pts}</td>
   </tr>`).join('')}</tbody></table></div>`;
  }

  function bowlTable(arr){
   if(!arr.length) return '<div class="md-no-data">No bowling data</div>';
   return `<div class="md-overflow"><table class="md-table"><thead><tr>
    <th class="md-th md-th-left">Player</th><th class="md-th md-th-right">Ov</th><th class="md-th md-th-right">R</th><th class="md-th md-th-right">W</th><th class="md-th md-th-right">Eco</th><th class="md-th md-th-right">Pts</th>
   </tr></thead><tbody>${arr.sort((a,b)=>b.wkts-a.wkts).map(p=>`<tr>
    <td class="md-td md-td-name" onclick="window.showPlayerModal('${escapeHtml(p.name)}')">${escapeHtml(p.name)}</td>
    <td class="md-td md-td-num">${p.overs}</td><td class="md-td md-td-num">${p.runs}</td><td class="md-td md-td-num-bold">${p.wkts}</td><td class="md-td md-td-num">${eco(p)}</td><td class="md-td md-td-pts ${ptsCls(p.pts)}">${p.pts>0?'+':''}${p.pts}</td>
   </tr>`).join('')}</tbody></table></div>`;
  }

  function fldTable(arr){
   if(!arr.length) return '';
   return `<div class="md-overflow"><table class="md-table"><thead><tr>
    <th class="md-th md-th-left">Player</th><th class="md-th md-th-right">Catches</th><th class="md-th md-th-right">Stumpings</th><th class="md-th md-th-right">Run-outs</th><th class="md-th md-th-right">Pts</th>
   </tr></thead><tbody>${arr.map(p=>`<tr>
    <td class="md-td md-td-name" onclick="window.showPlayerModal('${escapeHtml(p.name)}')">${escapeHtml(p.name)}</td>
    <td class="md-td md-td-num">${p.catches}</td>
    <td class="md-td md-td-num">${p.stumpings}</td>
    <td class="md-td md-td-num">${p.runouts}</td>
    <td class="md-td md-td-pts ${ptsCls(p.pts)}">${p.pts>0?'+':''}${p.pts}</td>
   </tr>`).join('')}</tbody></table></div>`;
  }

  // Group by team
  const t1bat=batters.filter(p=>isTeam1(p.team));
  const t2bat=batters.filter(p=>!isTeam1(p.team));
  const t1bowl=bowlers.filter(p=>isTeam1(p.team));
  const t2bowl=bowlers.filter(p=>!isTeam1(p.team));
  const t1fld=fielders.filter(p=>isTeam1(p.team));
  const t2fld=fielders.filter(p=>!isTeam1(p.team));

  const innings=`
   ${teamSec(team1+' — Batting',team1)}${batTable(t1bat)}
   ${teamSec(team1+' — Bowling',team1)}${bowlTable(t1bowl)}
   ${teamSec(team2+' — Batting',team2)}${batTable(t2bat)}
   ${teamSec(team2+' — Bowling',team2)}${bowlTable(t2bowl)}
   ${(t1fld.length||t2fld.length)?teamSec(team1+' — Fielding',team1)+fldTable(t1fld):''}
   ${t2fld.length?teamSec(team2+' — Fielding',team2)+fldTable(t2fld):''}
  `;

  // Total points for each team in this match
  const t1total=allPts.filter(p=>(p.iplTeam||getIplTeam(p.name))===team1).reduce((s,p)=>s+(p.pts||0),0);
  const t2total=allPts.filter(p=>(p.iplTeam||getIplTeam(p.name))===team2).reduce((s,p)=>s+(p.pts||0),0);

  // Points summary — all players sorted
  const ptsTable=`<div class="md-pts-summary-hdr"><div class="md-pts-summary-title">Points Summary</div>
   <div class="md-overflow"><table class="md-table"><thead><tr>
    <th class="md-th md-th-left">Player</th><th class="md-th md-th-left">Team</th><th class="md-th md-th-left">Breakdown</th><th class="md-th md-th-right">Pts</th>
   </tr></thead><tbody>${allPts.map(p=>`<tr>
    <td class="md-td md-td-name" onclick="window.showPlayerModal('${escapeHtml(p.name||'')}')">${escapeHtml(p.name||'--')}</td>
    <td class="md-td"><span class="badge bg">${p.iplTeam||getIplTeam(p.name)||'--'}</span></td>
    <td class="md-td md-td-breakdown">${(p.breakdown||'').replace(/ \| /g,' | ')}</td>
    <td class="md-td md-td-pts ${ptsCls(p.pts||0)}">${(p.pts||0)>0?'+':''}${p.pts||0}</td>
   </tr>`).join('')}</tbody></table></div></div>`;

  const deleteBtn=isAdmin?`<button class="btn btn-danger btn-sm" onclick="event.stopPropagation();window.deleteMatchD('${mid}','${escapeHtml(m.label||mid)}')">Delete</button>`:'';

  const _canManage=isAdmin||isSuperAdminEmail(user?.email);
  const snapshotBtn=_canManage?`<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();window.resnapshotMatchD('${mid}')" title="Update squad snapshot to current teams">Re-snapshot</button>`:'';
  const metaEditor=isAdmin?`<div class="md-meta-editor">
   <div class="md-meta-field"><span class="md-meta-label">Label</span><input class="edit-input edit-input-label" value="${escapeHtml(m.label||'')}" onblur="window.saveMatchMetaD('${mid}','label',this.value)"></div>
   <div class="md-meta-field"><span class="md-meta-label">Winner</span><input class="edit-input edit-input-winner" value="${escapeHtml(m.winner||'')}" onblur="window.saveMatchMetaD('${mid}','winner',this.value.toUpperCase())"></div>
   <div class="md-meta-field"><span class="md-meta-label">MOTM</span><input class="edit-input edit-input-motm" value="${escapeHtml(m.motm||'')}" onblur="window.saveMatchMetaD('${mid}','motm',this.value)"></div>
  </div>`:'';

  return`<div class="match-block" id="mb_${mid}">
   <div class="match-block-hdr" onclick="window.toggleMatchBlockD('${mid}')">
    <div class="lb-info">
     <div class="md-match-hdr-label">${escapeHtml(m.label||mid)}</div>
     <div class="md-match-hdr-tags">
      ${m.winner?`<span class="md-tag md-tag-winner">${escapeHtml(m.winner)} won</span>`:''}
      ${m.motm?`<span class="md-tag md-tag-motm">MOTM: ${escapeHtml(m.motm)}</span>`:''}
      <span class="md-tag md-tag-result">${resultLabel}</span>
      <span class="md-tag-team-pts">${team1}: ${t1total>=0?'+':''}${t1total} | ${team2}: ${t2total>=0?'+':''}${t2total}</span>
     </div>
    </div>
    <div class="md-match-hdr-actions">
     ${snapshotBtn}
     ${deleteBtn}
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="md-chevron${isOpen?' md-chevron-open':''}"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
   </div>
   <div class="match-body${isOpen?' open':''}" id="mbd_${mid}">
    ${metaEditor}${innings}${ptsTable}
   </div>
  </div>`;
 }).join('');
}

window.toggleMatchBlockD=function(mid){
 if(expandedMatchesDraft.has(mid)) expandedMatchesDraft.delete(mid);
 else expandedMatchesDraft.add(mid);
 const isOpen=expandedMatchesDraft.has(mid);
 const body=document.getElementById(`mbd_${mid}`);
 if(body) body.classList.toggle('open',isOpen);
 const chevron=document.querySelector(`#mb_${mid} .md-chevron`);
 if(chevron) chevron.classList.toggle('md-chevron-open',isOpen);
};

window.saveMatchMetaD=function(mid,field,value){
 if(!isAdmin||!draftId) return;
 update(ref(db,`drafts/${draftId}/matches/${mid}`),{[field]:value.trim()})
 .then(()=>window.showAlert(`${field} updated.`,'ok'))
 .catch(e=>window.showAlert(e.message));
};

window.savePlayerStatD=function(mid,pkey,field,value){
 if(!isAdmin||!draftId) return;
 update(ref(db,`drafts/${draftId}/matches/${mid}/players/${pkey}`),{[field]:value})
 .then(()=>window.showAlert('Saved.','ok'))
 .catch(e=>window.showAlert(e.message));
};

window.removePlayerFromMatchD=function(mid,pkey){
 if(!isAdmin||!draftId) return;
 if(!confirm('Remove this player from the match?')) return;
 remove(ref(db,`drafts/${draftId}/matches/${mid}/players/${pkey}`))
 .then(()=>window.showAlert('Player removed.','ok'))
 .catch(e=>window.showAlert(e.message));
};

window.addPlayerToMatchD=function(mid){
 if(!isAdmin||!draftId) return;
 const name=prompt('Player name:');
 if(!name||!name.trim()) return;
 const pkey=name.trim().toLowerCase().replace(/[^a-z0-9]/g,'_')+'_'+Date.now();
 set(ref(db,`drafts/${draftId}/matches/${mid}/players/${pkey}`),{
 name:name.trim(),pts:0,breakdown:'Manually added'
 }).then(()=>window.showAlert(`${name} added.`,'ok'))
 .catch(e=>window.showAlert(e.message));
};

window.deleteMatchD=function(mid,label){
 if(!isAdmin||!draftId) return;
 if(!confirm(`Permanently delete match "${label}"? This removes all points for this match.`)) return;
 remove(ref(db,`drafts/${draftId}/matches/${mid}`))
 .then(()=>{ expandedMatchesDraft.delete(mid); window.showAlert(`Match "${label}" deleted.`,'ok'); })
 .catch(e=>window.showAlert(e.message));
};

// -- Re-snapshot: overwrite a past match's squad snapshot with current team arrangements --
window.resnapshotMatchD=function(mid){
 if(!(isAdmin||isSuperAdminEmail(user?.email))||!draftId||!draftState?.teams) return;
 if(!confirm('Update this match\'s squad snapshot to the current team arrangements? This changes how points are counted for this match on the leaderboard.')) return;
 var snaps=buildSquadSnapshots(draftState.teams);
 set(ref(db,'drafts/'+draftId+'/matches/'+mid+'/squadSnapshots'),snaps)
 .then(function(){window.showAlert('Squad snapshot updated for this match.','ok');})
 .catch(function(e){window.showAlert('Failed: '+e.message);});
};

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// GLOBAL SCORECARD TAB -- pushes to ALL owned rooms
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

let gscImageFiles=[];
let gscBattingCount=0, gscBowlingCount=0, gscFieldingCount=0;

// -- File handling (same pattern as in-room parser) --
window.handleGscFiles=function(files){
 if(!files||!files.length) return;
 gscImageFiles=[...gscImageFiles,...Array.from(files)].slice(0,4);
 renderGscThumbs();
};

function renderGscThumbs(){
 const row=document.getElementById('gscThumbRow');
 if(!row) return;
 row.innerHTML='';
 gscImageFiles.forEach((file,i)=>{
 const url=URL.createObjectURL(file);
 const wrap=document.createElement('div');
 wrap.style.cssText='position:relative;display:inline-block;';
 const img=document.createElement('img');
 img.src=url;
 img.style.cssText='height:72px;width:auto;border-radius:6px;border:1px solid var(--b1);object-fit:cover;display:block;';
 const del=document.createElement('button');
 del.textContent='x';
 del.style.cssText='position:absolute;top:-6px;right:-6px;background:var(--err);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:.65rem;cursor:pointer;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;';
 del.onclick=()=>{gscImageFiles.splice(i,1);renderGscThumbs();};
 wrap.appendChild(img);wrap.appendChild(del);
 row.appendChild(wrap);
 });
 const hint=document.getElementById('gscDropHint');
 if(hint) hint.textContent=gscImageFiles.length?`${gscImageFiles.length} file${gscImageFiles.length>1?'s':''} loaded`:'PNG . JPG . WEBP . up to 4 files';
}

// -- Gemini parse for global scorecard --
window.parseGlobalScorecard=async function(){
 const statusEl=document.getElementById('gscParseStatus');
 const btn=document.getElementById('gscParseBtn');
 if(!gscImageFiles.length){
 statusEl.className='ai-status fail';
 statusEl.textContent='Upload at least one screenshot first.';
 return;
 }
 statusEl.className='ai-status parsing';
 statusEl.textContent=' Gemini is reading the scorecard...';
 btn.disabled=true; btn.textContent='Parsing...';
 try{
 const imageParts=await Promise.all(gscImageFiles.map(file=>new Promise((res,rej)=>{
 const reader=new FileReader();
 reader.onload=e=>res({inlineData:{data:e.target.result.split(',')[1],mimeType:file.type||'image/png'}});
 reader.onerror=rej;
 reader.readAsDataURL(file);
 })));
 const result=await getGeminiModel().generateContent({
 systemInstruction:SCORECARD_SYSTEM_PROMPT,
 contents:[{role:'user',parts:[...imageParts,{text:`Parse ${gscImageFiles.length>1?'these '+gscImageFiles.length+' scorecard screenshots':'this scorecard screenshot'} and return the JSON.`}]}]
 });
 const raw=result.response.text();
 const clean=raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
 const m=clean.match(/\{[\s\S]*\}/);
 if(!m) throw new Error('No valid JSON returned. Try clearer screenshots.');
 const parsed=JSON.parse(m[0]);
 populateGscForm(parsed);
 statusEl.className='ai-status done';
 statusEl.textContent=`Parsed: ${parsed.batting?.length||0} batters . ${parsed.bowling?.length||0} bowlers . ${parsed.fielding?.length||0} fielders. Review and save.`;
 }catch(e){
 statusEl.className='ai-status fail';
 statusEl.textContent=`\u274c ${e.message}`;
 }finally{
 btn.disabled=false; btn.textContent=' Parse with Gemini';
 }
};

// -- Row builders for global scorecard form --
function gscInputStyle(){ return 'sc-input'; }

window.addGscBattingRow=function(){
 const id=gscBattingCount++;
 const div=document.createElement('div');
 div.id=`gscbr${id}`;
 div.className='sc-row sc-row--gsc';
 div.innerHTML=`
 <input list="gscDlPlayers" placeholder="Player name" id="gscbr${id}name" class="sc-input"><input type="number" placeholder="R" id="gscbr${id}runs" min="0" class="sc-input"><input type="number" placeholder="B" id="gscbr${id}balls" min="0" class="sc-input"><input type="number" placeholder="4s" id="gscbr${id}fours" min="0" class="sc-input"><input type="number" placeholder="6s" id="gscbr${id}sixes" min="0" class="sc-input"><select id="gscbr${id}dis" class="sc-input"><option value="out">Out</option><option value="notout">Not Out</option><option value="duck">Duck</option></select><button onclick="document.getElementById('gscbr${id}').remove();gscBattingCount--;" class="btn btn-danger btn-sm sc-remove-btn">Remove</button>`;
 document.getElementById('gscBattingRows').appendChild(div);
 if(!document.getElementById('gscDlPlayers')){
 const dl=document.createElement('datalist'); dl.id='gscDlPlayers';
 // Populate from the 250-player RAW array (always available)
 const playerNames=[...new Set((RAW||[]).map(p=>p.n||'').filter(Boolean))];
 playerNames.forEach(n=>{ const o=document.createElement('option'); o.value=n; dl.appendChild(o); });
 document.getElementById('gscBattingRows').insertAdjacentElement('beforebegin',dl);
 }
};

window.addGscBowlingRow=function(){
 const id=gscBowlingCount++;
 const div=document.createElement('div');
 div.id=`gscbow${id}`;
 div.className='sc-row sc-row--gsc';
 div.innerHTML=`
 <input list="gscDlPlayers" placeholder="Player name" id="gscbow${id}name" class="sc-input"><input type="number" placeholder="Ov" id="gscbow${id}overs" min="0" step="0.1" class="sc-input"><input type="number" placeholder="R" id="gscbow${id}runs" min="0" class="sc-input"><input type="number" placeholder="Eco" id="gscbow${id}eco" min="0" step="0.01" class="sc-input"><input type="number" placeholder="W" id="gscbow${id}wkts" min="0" class="sc-input"><input type="number" placeholder="0s" id="gscbow${id}dots" min="0" class="sc-input"><input type="number" placeholder="Mdns" id="gscbow${id}maidens" min="0" class="sc-input"><button onclick="document.getElementById('gscbow${id}').remove();gscBowlingCount--;" class="btn btn-danger btn-sm sc-remove-btn">Remove</button>`;
 document.getElementById('gscBowlingRows').appendChild(div);
};

window.addGscFieldingRow=function(){
 const id=gscFieldingCount++;
 const div=document.createElement('div');
 div.id=`gscfld${id}`;
 div.className='sc-row sc-row--fielding';
 div.innerHTML=`
 <input list="gscDlPlayers" placeholder="Player name" id="gscfld${id}name" class="sc-input"><input type="number" placeholder="Catches" id="gscfld${id}catches" min="0" class="sc-input"><input type="number" placeholder="Stumpings" id="gscfld${id}stumpings" min="0" class="sc-input"><input type="number" placeholder="Run-outs" id="gscfld${id}runouts" min="0" class="sc-input"><button onclick="document.getElementById('gscfld${id}').remove();gscFieldingCount--;" class="btn btn-danger btn-sm sc-remove-btn">Remove</button>`;
 document.getElementById('gscFieldingRows').appendChild(div);
};

// -- Populate form from Gemini output --
function populateGscForm(parsed){
 if(parsed.matchLabel) document.getElementById('gscMatchLabel').value=parsed.matchLabel;
 if(parsed.winner) document.getElementById('gscWinner').value=parsed.winner;
 if(parsed.motm) document.getElementById('gscMotm').value=parsed.motm;
 if(parsed.result){
 const sel=document.getElementById('gscResult');
 if(sel)[...sel.options].forEach(o=>{if(o.value===parsed.result)o.selected=true;});
 }
 document.getElementById('gscBattingRows').innerHTML='';
 document.getElementById('gscBowlingRows').innerHTML='';
 document.getElementById('gscFieldingRows').innerHTML='';
 gscBattingCount=0; gscBowlingCount=0; gscFieldingCount=0;
 document.getElementById('gscFormBody').style.display='block';

 (parsed.batting||[]).forEach(b=>{
 window.addGscBattingRow();
 const id=gscBattingCount-1;
 const sv=(f,v)=>{const el=document.getElementById(`gscbr${id}${f}`);if(el)el.value=v;};
 sv('name',b.name||''); sv('runs',b.runs??''); sv('balls',b.balls??'');
 sv('fours',b.fours??''); sv('sixes',b.sixes??'');
 const dis=document.getElementById(`gscbr${id}dis`);
 if(dis)[...dis.options].forEach(o=>{if(o.value===(b.dismissal||'out'))o.selected=true;});
 });
 (parsed.bowling||[]).forEach(b=>{
 window.addGscBowlingRow();
 const id=gscBowlingCount-1;
 const sv=(f,v)=>{const el=document.getElementById(`gscbow${id}${f}`);if(el)el.value=v;};
 sv('name',b.name||''); sv('overs',b.overs??''); sv('runs',b.runs??'');
 sv('wkts',b.wickets??''); sv('dots',b.dots??''); sv('maidens',b.maidens??'');
 const _dov=parseFloat(b.overs)||0;
 const _dr=parseFloat(b.runs)||0;
 const _deco=parseFloat(b.economy||b.econ||b.economyRate||0)||(_dov>0?_dr/normalizeOvers(_dov):0);
 if(_deco>0){const gEl=document.getElementById(`gscbow${id}eco`);if(gEl)gEl.value=_deco.toFixed(2);}
 });
 const fm={};
 (parsed.fielding||[]).forEach(f=>{if((f.catches||0)+(f.stumpings||0)+(f.runouts||0)>0)fm[f.name]=f;});
 Object.values(fm).forEach(f=>{
 window.addGscFieldingRow();
 const id=gscFieldingCount-1;
 const sv=(f2,v)=>{const el=document.getElementById(`gscfld${id}${f2}`);if(el)el.value=v;};
 sv('name',f.name||''); sv('catches',f.catches||'');
 sv('stumpings',f.stumpings||''); sv('runouts',f.runouts||'');
 });
}

// -- Collect global form data --
function collectGscData(){
 const label=document.getElementById('gscMatchLabel').value.trim()||`Match ${Date.now()}`;
 const winner=(document.getElementById('gscWinner').value||'').trim().toUpperCase();
 const motm=(document.getElementById('gscMotm').value||'').trim().toLowerCase();
 const result=document.getElementById('gscResult').value;
 if(result==='noresult') return {label,result,playerPts:{}};
 const playerPts={};
 function addP(name,pts,src){
 const key=name.trim().toLowerCase();
 if(!key) return;
 if(!playerPts[key]) playerPts[key]={name:name.trim(),pts:0,breakdown:[]};
 playerPts[key].pts+=pts;
 playerPts[key].breakdown.push(`${src}: ${pts>=0?'+':''}${pts}`);
 }
 // Batting
 document.querySelectorAll('[id^="gscbr"][id$="name"]').forEach(inp=>{
 const id=inp.id.replace('name','');
 const name=inp.value.trim(); if(!name) return;
 const runs=parseInt(document.getElementById(`${id}runs`)?.value)||0;
 const balls=parseInt(document.getElementById(`${id}balls`)?.value)||0;
 const fours=parseInt(document.getElementById(`${id}fours`)?.value)||0;
 const sixes=parseInt(document.getElementById(`${id}sixes`)?.value)||0;
 const dis=document.getElementById(`${id}dis`)?.value||'out';
 const isMot=name.toLowerCase()===motm;
 const pts=calcBattingPoints(runs,balls,fours,sixes,dis,false,isMot);
 addP(name,pts,`Bat(${runs}r ${balls}b ${fours}\u00d74 ${sixes}\u00d76${dis==='duck'?' DUCK':''})`);
 });
 // Bowling
 document.querySelectorAll('[id^="gscbow"][id$="name"]').forEach(inp=>{
 const id=inp.id.replace('name','');
 const name=inp.value.trim(); if(!name) return;
 const overs=parseFloat(document.getElementById(`${id}overs`)?.value)||0;
 const runs=parseInt(document.getElementById(`${id}runs`)?.value)||0;
 const wkts=parseInt(document.getElementById(`${id}wkts`)?.value)||0;
 const dots=parseInt(document.getElementById(`${id}dots`)?.value)||0;
 const eco=parseFloat(document.getElementById(`${id}eco`)?.value)||0;
 const maidens=parseInt(document.getElementById(`${id}maidens`)?.value)||0;
 const isMot=name.toLowerCase()===motm;
 const pts=calcBowlingPoints(overs,runs,wkts,dots,maidens,false,isMot);
 addP(name,pts,`Bowl(${wkts}w ${overs}ov eco:${eco>0?eco.toFixed(2):overs>0?(runs/normalizeOvers(overs)).toFixed(2):'--'})`);
 });
 // Fielding
 document.querySelectorAll('[id^="gscfld"][id$="name"]').forEach(inp=>{
 const id=inp.id.replace('name','');
 const name=inp.value.trim(); if(!name) return;
 const catches=parseInt(document.getElementById(`${id}catches`)?.value)||0;
 const stumpings=parseInt(document.getElementById(`${id}stumpings`)?.value)||0;
 const runouts=parseInt(document.getElementById(`${id}runouts`)?.value)||0;
 if(catches+stumpings+runouts===0) return;
 const isMot=name.toLowerCase()===motm;
 const pts=calcFieldingPoints(catches,stumpings,runouts,false,isMot);
 addP(name,pts,`Field(${catches}c ${stumpings}st ${runouts}ro)`);
 });
 // Winning team bonus — match scorecard names against player database
 if(winner){
  var _pdb = RAW || [];
  _pdb.forEach(function(p){
   var pnameFull = (p.name || p.n || '').trim().toLowerCase();
   var pnameClean = pnameFull.replace(/\*?\s*\([^)]*\)\s*$/, '').trim();
   var pteam = (p.iplTeam || p.t || '').toUpperCase();
   if(pteam === winner){
    var matched = playerPts[pnameFull] || playerPts[pnameClean];
    if(matched){
     matched.pts += 5;
     matched.breakdown.push('Winning team: +5');
    }
   }
  });
 }
 return {label,result,winner,motm,playerPts};
}

// -- Preview global points --
window.previewGlobalPoints=function(){
 const data=collectGscData();
 if(data.result==='noresult'){window.showAlert('No Result -- no points awarded.','info');return;}
 const entries=Object.values(data.playerPts).sort((a,b)=>b.pts-a.pts);
 if(!entries.length){window.showAlert('No player data entered.','err');return;}
 const box=document.getElementById('gscPreviewBox');
 const content=document.getElementById('gscPreviewContent');
 content.innerHTML=`<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.85rem;"><thead><tr style="background:rgba(0,0,0,.3);"><th style="padding:8px 12px;text-align:left;color:var(--accent);">Player</th><th style="padding:8px 12px;text-align:right;color:var(--accent);">Points</th><th style="padding:8px 12px;text-align:left;color:var(--accent);">Breakdown</th></tr></thead><tbody>${entries.map(e=>`<tr style="border-bottom:1px solid var(--b1);"><td style="padding:8px 12px;font-weight:600;cursor:pointer;" onclick="window.showPlayerModal('${escapeHtml(e.name)}')">${escapeHtml(e.name)}</td><td style="padding:8px 12px;text-align:right;font-family:var(--f);font-size:1.1rem;color:${e.pts>=0?'var(--ok)':'var(--err)'};">${e.pts>=0?'+':''}${e.pts}</td><td style="padding:8px 12px;font-size:.78rem;color:var(--dim2);">${e.breakdown.join(' . ')}</td></tr>`).join('')}</tbody></table></div>`;
 box.style.display='block';
};

// -- Save & fan-out to all owned rooms --
window.saveGlobalScorecard=async function(){
 if(!user) return;
 const statusEl=document.getElementById('gscSaveStatus');
 const data=collectGscData();
 if(!data.label){statusEl.className='ai-status fail';statusEl.textContent='Enter a match label first.';return;}

 statusEl.className='ai-status parsing';
 statusEl.textContent=' Saving and pushing to all your rooms...';

 // Build match record
 const matchId=`m${Date.now()}`;
 const matchRecord={
 label:data.label,
 result:data.result,
 winner:data.winner||'',
 motm:data.motm||'',
 timestamp:Date.now(),
 players:{}
 };
 var _ownerMap={};
 if(draftState&&draftState.teams){
  Object.values(draftState.teams).forEach(function(t){
   var roster=Array.isArray(t.roster)?t.roster:(t.roster?Object.values(t.roster):[]);
   roster.forEach(function(p){ _ownerMap[(p.name||p.n||'').toLowerCase().trim()]=t.name; });
  });
 }
 Object.entries(data.playerPts).forEach(([key,val])=>{
 var fbKey=key.replace(/[.#$\/\[\]]/g,'_');
 matchRecord.players[fbKey]={name:val.name,pts:val.pts,breakdown:val.breakdown.join(' | '),ownedBy:_ownerMap[(val.name||'').toLowerCase().trim()]||''};
 });

 try{
 // 1. Save to user's global scorecard store (source of truth)
 await set(ref(db,`users/${user.uid}/scorecards/${matchId}`),matchRecord);

 // 2. Fan-out: get all owned auction rooms
 const [aSnap,dSnap]=await Promise.all([
 get(ref(db,`users/${user.uid}/auctions`)),
 get(ref(db,`users/${user.uid}/drafts`))
 ]);

 const fanOutWrites={};
 const aRooms=aSnap.val()||{};
 const dRooms=dSnap.val()||{};

 // Duplicate detection: delete old matches with same label before pushing new
 const dupCleanPromises=[];
 const matchLabel=data.label.toLowerCase().trim();
 Object.keys(aRooms).forEach(function(rid){
  dupCleanPromises.push(get(ref(db,'auctions/'+rid+'/matches')).then(function(mSnap){
   var matches=mSnap.val()||{}; var delWrites={};
   Object.entries(matches).forEach(function(me){
    if((me[1].label||'').toLowerCase().trim()===matchLabel) delWrites['auctions/'+rid+'/matches/'+me[0]]=null;
   });
   if(Object.keys(delWrites).length>0) return update(ref(db),delWrites);
  }).catch(function(){}));
 });
 Object.keys(dRooms).forEach(function(rid){
  dupCleanPromises.push(get(ref(db,'drafts/'+rid+'/matches')).then(function(mSnap){
   var matches=mSnap.val()||{}; var delWrites={};
   Object.entries(matches).forEach(function(me){
    if((me[1].label||'').toLowerCase().trim()===matchLabel) delWrites['drafts/'+rid+'/matches/'+me[0]]=null;
   });
   if(Object.keys(delWrites).length>0) return update(ref(db),delWrites);
  }).catch(function(){}));
 });
 await Promise.all(dupCleanPromises);

 Object.keys(aRooms).forEach(rid=>{
 fanOutWrites[`auctions/${rid}/matches/${matchId}`]=matchRecord;
 });
 Object.keys(dRooms).forEach(rid=>{
 fanOutWrites[`drafts/${rid}/matches/${matchId}`]=matchRecord;
 });

 const totalRooms=Object.keys(aRooms).length+Object.keys(dRooms).length;

 if(totalRooms>0){
 await update(ref(db),fanOutWrites);
 // Post-push: save squad snapshots AND increment leaderboard totals for each room
 var _snapPromises=[];
 Object.keys(aRooms).forEach(function(rid){
  _snapPromises.push(get(ref(db,'auctions/'+rid)).then(function(roomSnap){
   var roomData=roomSnap.val()||{};
   var teams=roomData.teams||{};
   var snaps=buildSquadSnapshots(teams);
   var writes={};
   if(Object.keys(snaps).length){
    Object.entries(snaps).forEach(function(se){writes['auctions/'+rid+'/matches/'+matchId+'/squadSnapshots/'+se[0]]=se[1];});
   }
   // Recalculate leaderboard totals from scratch (prevents double-counting)
   var xiMult=parseFloat(roomData.xiMultiplier)||1;
   var allMatches=roomData.matches||{};
   allMatches[matchId]=matchRecord;
   if(!allMatches[matchId].squadSnapshots) allMatches[matchId].squadSnapshots={};
   Object.entries(snaps).forEach(function(se2){allMatches[matchId].squadSnapshots[se2[0]]=se2[1];});
   var totals={}; Object.values(teams).forEach(function(t2){totals[t2.name]={pts:0,topPlayer:'--',topPts:0,playerCount:0,_players:{}};});
   Object.entries(allMatches).forEach(function(me2){
    var m2=me2[1]; if(!m2?.players) return;
    var c2=computeMatchContribution(m2, m2.squadSnapshots||snaps, teams, xiMult);
    Object.entries(c2).forEach(function(ce2){var tn3=ce2[0],cc=ce2[1];if(!totals[tn3])totals[tn3]={pts:0,topPlayer:'--',topPts:0,playerCount:0,_players:{}};totals[tn3].pts+=cc.pts;Object.entries(cc.players).forEach(function(pe){totals[tn3]._players[pe[0]]=(totals[tn3]._players[pe[0]]||0)+pe[1];});});
   });
   var storedNew={}; Object.entries(totals).forEach(function(te){var tn4=te[0],tt=te[1],topP='--',topPts=0,pCount=0;Object.entries(tt._players).forEach(function(pe){if(pe[1]!==0)pCount++;if(pe[1]>topPts){topPts=pe[1];topP=pe[0];}});storedNew[tn4]={pts:Math.round(tt.pts*100)/100,topPlayer:topP,topPts:Math.round(topPts*100)/100,playerCount:pCount};});
   writes['auctions/'+rid+'/leaderboardTotals']=storedNew;
   return update(ref(db),writes);
  }).catch(function(){}));
 });
 Object.keys(dRooms).forEach(function(rid){
  _snapPromises.push(get(ref(db,'drafts/'+rid)).then(function(roomSnap){
   var roomData=roomSnap.val()||{};
   var teams=roomData.teams||{};
   var snaps=buildSquadSnapshots(teams);
   var writes={};
   if(Object.keys(snaps).length){
    Object.entries(snaps).forEach(function(se){writes['drafts/'+rid+'/matches/'+matchId+'/squadSnapshots/'+se[0]]=se[1];});
   }
   // Recalculate leaderboard totals from scratch
   var xiMult=parseFloat(roomData.xiMultiplier)||1;
   var allMatches=roomData.matches||{};
   allMatches[matchId]=matchRecord;
   if(!allMatches[matchId].squadSnapshots) allMatches[matchId].squadSnapshots={};
   Object.entries(snaps).forEach(function(se2){allMatches[matchId].squadSnapshots[se2[0]]=se2[1];});
   var totals={}; Object.values(teams).forEach(function(t2){totals[t2.name]={pts:0,topPlayer:'--',topPts:0,playerCount:0,_players:{}};});
   Object.entries(allMatches).forEach(function(me2){
    var m2=me2[1]; if(!m2?.players) return;
    var c2=computeMatchContribution(m2, m2.squadSnapshots||snaps, teams, xiMult);
    Object.entries(c2).forEach(function(ce2){var tn3=ce2[0],cc=ce2[1];if(!totals[tn3])totals[tn3]={pts:0,topPlayer:'--',topPts:0,playerCount:0,_players:{}};totals[tn3].pts+=cc.pts;Object.entries(cc.players).forEach(function(pe){totals[tn3]._players[pe[0]]=(totals[tn3]._players[pe[0]]||0)+pe[1];});});
   });
   var storedNew={}; Object.entries(totals).forEach(function(te){var tn4=te[0],tt=te[1],topP='--',topPts=0,pCount=0;Object.entries(tt._players).forEach(function(pe){if(pe[1]!==0)pCount++;if(pe[1]>topPts){topPts=pe[1];topP=pe[0];}});storedNew[tn4]={pts:Math.round(tt.pts*100)/100,topPlayer:topP,topPts:Math.round(topPts*100)/100,playerCount:pCount};});
   writes['drafts/'+rid+'/leaderboardTotals']=storedNew;
   return update(ref(db),writes);
  }).catch(function(){}));
 });
 await Promise.all(_snapPromises);
 }

 statusEl.className='ai-status done';
 statusEl.textContent=`"${data.label}" saved and pushed to ${totalRooms} room${totalRooms===1?'':'s'} (${Object.keys(aRooms).length} auction . ${Object.keys(dRooms).length} draft).`;

 // Reset form
 document.getElementById('gscBattingRows').innerHTML='';
 document.getElementById('gscBowlingRows').innerHTML='';
 document.getElementById('gscFieldingRows').innerHTML='';
 document.getElementById('gscMatchLabel').value='';
 document.getElementById('gscWinner').value='';
 document.getElementById('gscMotm').value='';
 document.getElementById('gscPreviewBox').style.display='none';
 gscBattingCount=0; gscBowlingCount=0; gscFieldingCount=0;
 gscImageFiles=[];
 renderGscThumbs();
 document.getElementById('gscFormBody').style.display='none';
 renderGlobalScorecardHistory();

 }catch(e){
 statusEl.className='ai-status fail';
 statusEl.textContent=`\u274c Save failed: ${e.message}`;
 }
};

// -- Render global scorecard history --
function renderGlobalScorecardHistory(){
 if(!user) return;
 const list=document.getElementById('gscHistoryList');
 if(!list) return;
 get(ref(db,`users/${user.uid}/scorecards`)).then(snap=>{
 const data=snap.val();
 if(!data){list.innerHTML='<div class="empty">No matches saved yet.</div>';return;}
 const entries=Object.entries(data).sort((a,b)=>(b[1].timestamp||0)-(a[1].timestamp||0));
 list.innerHTML=entries.map(([mid,m])=>{
 const playerCount=m.players?Object.keys(m.players).length:0;
 const topPlayer=m.players?Object.values(m.players).sort((a,b)=>(b.pts||0)-(a.pts||0))[0]:null;
 const resultLabel=m.result==='noresult'?'No Result':m.result==='superover'?'Super Over':'Completed';
 const winChip=m.winner?`<span class="gsc-chip win">Winner: ${escapeHtml(m.winner)}</span>`:'';
 const motmChip=m.motm?`<span class="gsc-chip motm">MOTM: ${escapeHtml(m.motm)}</span>`:'';
 const resChip=`<span class="gsc-chip count">${resultLabel}</span>`;
 const pcChip=`<span class="gsc-chip count">${playerCount} players</span>`;
 const topChip=topPlayer?`<span class="gsc-chip top">Top: ${escapeHtml(topPlayer.name)} ${topPlayer.pts>=0?'+':''}${topPlayer.pts}</span>`:'';
 return`<div class="gsc-history-row"><div><div class="gsc-history-label">${escapeHtml(m.label||mid)}</div><div class="text-dim">${winChip}${motmChip}${resChip}${pcChip}${topChip}</div></div><div class="btn-group"><button class="btn btn-ghost btn-sm" onclick="window.repushScorecard('${mid}')">Re-push</button><button class="btn btn-danger btn-sm" onclick="window.deleteGlobalScorecard('${mid}','${escapeHtml(m.label||mid)}')">Delete</button></div></div>`;
 }).join('');
 }).catch(e=>{ list.innerHTML=`<div class="empty">Error loading: ${e.message}</div>`; });
}

// -- Re-push a previously saved scorecard to all rooms --
window.repushScorecard=async function(mid){
 if(!user) return;
 try{
 const snap=await get(ref(db,`users/${user.uid}/scorecards/${mid}`));
 if(!snap.exists()){window.showAlert('Scorecard not found.','err');return;}
 const matchRecord=snap.val();
 const [aSnap,dSnap]=await Promise.all([
 get(ref(db,`users/${user.uid}/auctions`)),
 get(ref(db,`users/${user.uid}/drafts`))
 ]);
 const fanOut={};
 Object.keys(aSnap.val()||{}).forEach(rid=>{fanOut[`auctions/${rid}/matches/${mid}`]=matchRecord;});
 Object.keys(dSnap.val()||{}).forEach(rid=>{fanOut[`drafts/${rid}/matches/${mid}`]=matchRecord;});
 await update(ref(db),fanOut);
 const total=Object.keys(aSnap.val()||{}).length+Object.keys(dSnap.val()||{}).length;
 window.showAlert(`Re-pushed "${matchRecord.label}" to ${total} room${total===1?'':'s'}.`,'ok');
 }catch(e){ window.showAlert('Re-push failed: '+e.message); }
};

// -- Delete a global scorecard --
window.deleteGlobalScorecard=async function(mid,label){
 if(!user) return;
 if(!confirm(`Delete "${label}"?\n\nThis removes it from your Scorecards list.`)) return;

 // Ask if they also want to wipe it from all rooms
 const fromRooms=confirm(`Also remove "${label}" points from ALL your rooms?\n\nOK = remove from all rooms too\nCancel = keep points in rooms (global list only)`);

 try{
 const writes=[];

 // Always remove from global scorecard store
 writes.push(remove(ref(db,`users/${user.uid}/scorecards/${mid}`)));

 if(fromRooms){
 // Fan-out: remove from every owned auction + draft room
 const [aSnap,dSnap]=await Promise.all([
 get(ref(db,`users/${user.uid}/auctions`)),
 get(ref(db,`users/${user.uid}/drafts`))
 ]);
 const fanOut={};
 Object.keys(aSnap.val()||{}).forEach(rid=>{ fanOut[`auctions/${rid}/matches/${mid}`]=null; });
 Object.keys(dSnap.val()||{}).forEach(rid=>{ fanOut[`drafts/${rid}/matches/${mid}`]=null; });
 if(Object.keys(fanOut).length>0) writes.push(update(ref(db),fanOut));
 }

 await Promise.all(writes);
 const msg=fromRooms
 ?`"${label}" deleted from scorecards and all rooms.`
 :`"${label}" deleted from scorecards. Room points unchanged.`;
 window.showAlert(msg,'ok');
 renderGlobalScorecardHistory();
 }catch(e){ window.showAlert('Delete failed: '+e.message); }
};

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// SUPER ADMIN PANEL
// Only accessible to namanmehra@gmail.com
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

function isSuperAdmin(){ return isSuperAdminEmail(user?.email); }

async function renderSuperAdminPanel(){
 if(!isSuperAdmin()) return;

 const statusEl=document.getElementById('saPushStatus');
 const roomsList=document.getElementById('saRoomsList');
 if(roomsList) roomsList.innerHTML='<div class="empty" style="padding:20px;">Loading all rooms...</div>';

 try{
 // Scan all users to collect every room
 const usersSnap=await get(ref(db,'users'));
 const usersData=usersSnap.val()||{};

 let totalUsers=0, allAuctions={}, allDrafts={}, totalMatches=0;

 Object.entries(usersData).forEach(([uid,udata])=>{
 totalUsers++;
 if(udata.auctions) Object.entries(udata.auctions).forEach(([rid,r])=>{ allAuctions[rid]={...r,_ownerUid:uid,_ownerEmail:r.email||uid}; });
 if(udata.drafts) Object.entries(udata.drafts).forEach(([rid,r])=>{ allDrafts[rid]={...r,_ownerUid:uid,_ownerEmail:r.email||uid}; });
 });

 // Get global scorecards for push selector
 const scSnap=await get(ref(db,`users/${user.uid}/scorecards`));
 const scorecards=scSnap.val()||{};
 totalMatches=Object.keys(scorecards).length;

 // Count matches across all rooms (sample first 5 auction rooms)
 // Update stats
 document.getElementById('sa-total-users').textContent=totalUsers;
 document.getElementById('sa-total-auctions').textContent=Object.keys(allAuctions).length;
 document.getElementById('sa-total-drafts').textContent=Object.keys(allDrafts).length;
 document.getElementById('sa-total-matches').textContent=totalMatches;

 // Populate scorecard select
 const sel=document.getElementById('saScorecardSelect');
 if(sel){
 sel.innerHTML='<option value="">-- Select a saved scorecard --</option>';
 Object.entries(scorecards).sort((a,b)=>(b[1].timestamp||0)-(a[1].timestamp||0)).forEach(([mid,m])=>{
 const opt=document.createElement('option');
 const pc=m.players?Object.keys(m.players).length:0;
 const top=m.players?Object.values(m.players).sort((a,b)=>(b.pts||0)-(a.pts||0))[0]:null;
 const hints=[];
 if(m.winner) hints.push('W: '+m.winner);
 hints.push(pc+' players');
 if(top) hints.push('+'+top.pts+' top');
 opt.value=mid;
 opt.textContent=(m.label||mid)+(hints.length?' · '+hints.join(' · '):'');
 sel.appendChild(opt);
 });
 }

 // Render rooms list
 if(!roomsList) return;
 const aEntries=Object.entries(allAuctions).sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));
 const dEntries=Object.entries(allDrafts).sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));

 if(!aEntries.length&&!dEntries.length){
 roomsList.innerHTML='<div class="empty" style="padding:20px;">No rooms found on platform.</div>';
 return;
 }

 const makeRoomRow=(rid,r,type)=>{
  const roomName=escapeHtml(r.name||r.roomName||'Untitled room');
  const owner=escapeHtml(r._ownerEmail||(r._ownerUid?r._ownerUid.substring(0,8)+'…':''));
  const teamCount=r.teams?Object.keys(r.teams).length:0;
  const matchCount=r.matches?Object.keys(r.matches).length:0;
  const created=r.createdAt?new Date(r.createdAt).toLocaleDateString():'—';
  const shortId=escapeHtml(rid.substring(0,8));
  return`<div class="sa-room-card"><div class="sa-room-main"><div class="sa-room-name">${roomName}<span class="room-type-pill ${type}">${type==='auction'?'Auction':'Draft'}</span></div><div class="sa-room-meta"><span><span class="sa-meta-k">Owner</span>${owner||'—'}</span><span class="sa-room-count">${teamCount} teams</span><span class="sa-room-count">${matchCount} matches</span><span><span class="sa-meta-k">Created</span>${created}</span><span><span class="sa-meta-k">ID</span><code>${shortId}</code></span></div></div><div class="btn-group"><button class="btn btn-ghost btn-sm" onclick="window.saViewRoom('${rid}','${type}')">View</button><button class="btn btn-danger btn-sm" onclick="window.saDeleteRoom('${rid}','${type}','${escapeHtml((r.name||r.roomName||rid).replace(/'/g,"\\'"))}')">Delete</button></div></div>`;
 };

 roomsList.innerHTML=
 `<div class="sa-section-hdr">Auction Rooms (${aEntries.length})</div>`+
 (aEntries.length?aEntries.map(([rid,r])=>makeRoomRow(rid,r,'auction')).join(''):'<div class="empty">No auction rooms.</div>')+
 `<div class="sa-section-hdr">Draft Rooms (${dEntries.length})</div>`+
 (dEntries.length?dEntries.map(([rid,r])=>makeRoomRow(rid,r,'draft')).join(''):'<div class="empty">No draft rooms.</div>');

 }catch(e){
 if(roomsList) roomsList.innerHTML=`<div class="empty" style="padding:20px;color:var(--err);">Error: ${e.message}</div>`;
 console.error('SA panel error:',e);
 }
}

// -- Push scorecard to EVERY room on platform --
window.saPushToAll=async function(){
 if(!isSuperAdmin()) return;
 const mid=document.getElementById('saScorecardSelect')?.value;
 const statusEl=document.getElementById('saPushStatus');
 if(!mid){statusEl.className='ai-status fail';statusEl.textContent='Select a scorecard first.';return;}

 statusEl.className='ai-status parsing';
 statusEl.textContent=' Scanning all rooms and pushing...';

 try{
 const scSnap=await get(ref(db,`users/${user.uid}/scorecards/${mid}`));
 if(!scSnap.exists()){statusEl.className='ai-status fail';statusEl.textContent='\u274c Scorecard not found.';return;}
 const matchRecord=scSnap.val();

 // Scan all users to find all room IDs
 const usersSnap=await get(ref(db,'users'));
 const usersData=usersSnap.val()||{};

 const auctionRids=new Set(), draftRids=new Set();
 Object.values(usersData).forEach(udata=>{
  if(udata.auctions) Object.keys(udata.auctions).forEach(rid=>auctionRids.add(rid));
  if(udata.drafts) Object.keys(udata.drafts).forEach(rid=>draftRids.add(rid));
  if(udata.joined) Object.keys(udata.joined).forEach(rid=>auctionRids.add(rid));
  if(udata.joinedDrafts) Object.keys(udata.joinedDrafts).forEach(rid=>draftRids.add(rid));
 });

 if(!auctionRids.size&&!draftRids.size){
 statusEl.className='ai-status fail';
 statusEl.textContent='No rooms found on the platform.';
 return;
 }

 // Fan-out match record first
 const fanOut={};
 auctionRids.forEach(rid=>{fanOut[`auctions/${rid}/matches/${mid}`]=matchRecord;});
 draftRids.forEach(rid=>{fanOut[`drafts/${rid}/matches/${mid}`]=matchRecord;});
 await update(ref(db),fanOut);

 // Post-push: snapshots + leaderboard totals for each room
 statusEl.textContent=' Saving snapshots and updating leaderboard totals...';
 var postPromises=[];
 auctionRids.forEach(function(rid){
  postPromises.push(get(ref(db,'auctions/'+rid)).then(function(roomSnap){
   var roomData=roomSnap.val()||{};
   var teams=roomData.teams||{};
   var snaps=buildSquadSnapshots(teams);
   var upd={};
   Object.entries(snaps).forEach(function(se){upd['auctions/'+rid+'/matches/'+mid+'/squadSnapshots/'+se[0]]=se[1];});
   var xiMult=parseFloat(roomData.xiMultiplier)||1;
   var contrib=computeMatchContribution(matchRecord, snaps, teams, xiMult);
   var stored=roomData.leaderboardTotals||{};
   Object.entries(contrib).forEach(function(ce){
    var tn=ce[0], c=ce[1];
    if(!stored[tn]) stored[tn]={pts:0,topPlayer:'--',topPts:0,playerCount:0};
    stored[tn].pts=Math.round((stored[tn].pts+c.pts)*100)/100;
    var bestN='--',bestP=0,pC=0;
    Object.entries(c.players).forEach(function(pe){if(pe[1]!==0)pC++;if(pe[1]>bestP){bestP=pe[1];bestN=pe[0];}});
    stored[tn].playerCount=(stored[tn].playerCount||0)+pC;
    if(bestP>stored[tn].topPts){stored[tn].topPts=bestP;stored[tn].topPlayer=bestN;}
   });
   upd['auctions/'+rid+'/leaderboardTotals']=stored;
   return update(ref(db),upd);
  }).catch(function(){}));
 });
 draftRids.forEach(function(rid){
  postPromises.push(get(ref(db,'drafts/'+rid)).then(function(roomSnap){
   var roomData=roomSnap.val()||{};
   var teams=roomData.teams||{};
   var snaps=buildSquadSnapshots(teams);
   var upd={};
   Object.entries(snaps).forEach(function(se){upd['drafts/'+rid+'/matches/'+mid+'/squadSnapshots/'+se[0]]=se[1];});
   var xiMult=parseFloat(roomData.xiMultiplier)||1;
   var contrib=computeMatchContribution(matchRecord, snaps, teams, xiMult);
   var stored=roomData.leaderboardTotals||{};
   Object.entries(contrib).forEach(function(ce){
    var tn=ce[0], c=ce[1];
    if(!stored[tn]) stored[tn]={pts:0,topPlayer:'--',topPts:0,playerCount:0};
    stored[tn].pts=Math.round((stored[tn].pts+c.pts)*100)/100;
    var bestN='--',bestP=0,pC=0;
    Object.entries(c.players).forEach(function(pe){if(pe[1]!==0)pC++;if(pe[1]>bestP){bestP=pe[1];bestN=pe[0];}});
    stored[tn].playerCount=(stored[tn].playerCount||0)+pC;
    if(bestP>stored[tn].topPts){stored[tn].topPts=bestP;stored[tn].topPlayer=bestN;}
   });
   upd['drafts/'+rid+'/leaderboardTotals']=stored;
   return update(ref(db),upd);
  }).catch(function(){}));
 });
 await Promise.all(postPromises);

 statusEl.className='ai-status done';
 statusEl.textContent=`"${matchRecord.label}" pushed to ${auctionRids.size} auction + ${draftRids.size} draft rooms. Leaderboard totals updated.`;

 }catch(e){
 statusEl.className='ai-status fail';
 statusEl.textContent=`\u274c Push failed: ${e.message}`;
 }
};

// -- View a room (navigate into it) --
window.saViewRoom=function(rid,type){
 if(!isSuperAdmin()) return;
 if(type==='auction') window.location.search=`?room=${rid}`;
 else window.location.search=`?draft=${rid}`;
};

// -- Delete any room (super admin power) --
window.saDeleteRoom=async function(rid,type,name){
 if(!isSuperAdmin()) return;
 if(!confirm(`Delete ${type} room "${name}" (${rid})?\n\nThis permanently removes the room and ALL its data.`)) return;
 try{
 const path=type==='auction'?`auctions/${rid}`:`drafts/${rid}`;
 await remove(ref(db,path));
 // Also remove from all users' room lists
 const usersSnap=await get(ref(db,'users'));
 const usersData=usersSnap.val()||{};
 const cleanUp={};
 const userKey=type==='auction'?'auctions':'drafts';
 const joinedKey=type==='auction'?'joined':'joinedDrafts';
 Object.keys(usersData).forEach(uid=>{
 cleanUp[`users/${uid}/${userKey}/${rid}`]=null;
 cleanUp[`users/${uid}/${joinedKey}/${rid}`]=null;
 });
 await update(ref(db),cleanUp);
 window.showAlert(`Room "${name}" deleted.`,'ok');
 renderSuperAdminPanel();
 }catch(e){ window.showAlert('Delete failed: '+e.message); }
};

// -- Super admin: show match info when scorecard selected --
window.saOnScorecardSelect=async function(){
 const mid=document.getElementById('saScorecardSelect')?.value;
 const infoBox=document.getElementById('saMatchInfo');
 const infoText=document.getElementById('saMatchInfoText');
 if(!mid||!infoBox){if(infoBox)infoBox.style.display='none';return;}
 try{
 const snap=await get(ref(db,`users/${user.uid}/scorecards/${mid}`));
 if(!snap.exists()){infoBox.style.display='none';return;}
 const m=snap.val();
 const playerCount=m.players?Object.keys(m.players).length:0;
 infoBox.style.display='block';
 infoText.innerHTML=`<strong style="color:var(--accent)">${escapeHtml(m.label||mid)}</strong>&nbsp;.&nbsp; Winner: ${escapeHtml(m.winner||'--')} &nbsp;.&nbsp; MOTM: ${escapeHtml(m.motm||'--')} &nbsp;.&nbsp; ${playerCount} players scored`;
 }catch(e){ infoBox.style.display='none'; }
};

// -- Delete from all rooms (without deleting scorecard record) --
window.saDeleteMatchFromAll=async function(){
 if(!isSuperAdmin()) return;
 const mid=document.getElementById('saScorecardSelect')?.value;
 const statusEl=document.getElementById('saPushStatus');
 if(!mid){statusEl.className='ai-status fail';statusEl.textContent='Select a scorecard first.';return;}
 if(!confirm('Remove this match from ALL rooms on the platform?\n\nThe scorecard record will remain in your Scorecards list.')) return;
 statusEl.className='ai-status parsing';
 statusEl.textContent=' Removing match from all rooms...';
 try{
 const usersSnap=await get(ref(db,'users'));
 const usersData=usersSnap.val()||{};
 const fanOut={};
 let aCount=0,dCount=0;
 Object.values(usersData).forEach(udata=>{
 if(udata.auctions) Object.keys(udata.auctions).forEach(rid=>{ fanOut[`auctions/${rid}/matches/${mid}`]=null; aCount++; });
 if(udata.drafts) Object.keys(udata.drafts).forEach(rid=>{ fanOut[`drafts/${rid}/matches/${mid}`]=null; dCount++; });
 });
 if(!Object.keys(fanOut).length){statusEl.className='ai-status fail';statusEl.textContent='No rooms found.';return;}
 await update(ref(db),fanOut);
 statusEl.className='ai-status done';
 statusEl.textContent=`Match removed from ${aCount} auction + ${dCount} draft rooms.`;
 }catch(e){statusEl.className='ai-status fail';statusEl.textContent=`\u274c ${e.message}`;}
};




// Patch after any analytics render
const _origRAD = window.renderAnalyticsDraft;
if(_origRAD) window.renderAnalyticsDraft = function(...args){ _origRAD(...args); setTimeout(patchDarkCards,50); };
const _origRA = window.renderAnalytics;
if(_origRA) window.renderAnalytics = function(...args){ _origRA(...args); setTimeout(patchDarkCards,50); };


// -- SA: Overseas Limit Tweaker --
window.saPopulateOsRooms=async function(){
  const sel=document.getElementById('saOsRoomSelect');
  if(!sel) return;
  try{
    const usersSnap=await get(ref(db,'users'));
    const users=usersSnap.val()||{};
    const auctionRooms=new Map();
    const draftRooms=new Map();
    Object.values(users).forEach(u=>{
      const em=u.email||'';
      if(u.auctions) Object.entries(u.auctions).forEach(([rid,r])=>auctionRooms.set(rid,{ownerEmail:r?.email||em,name:r?.name||r?.roomName||''}));
      if(u.drafts) Object.entries(u.drafts).forEach(([rid,r])=>draftRooms.set(rid,{ownerEmail:r?.email||em,name:r?.name||r?.roomName||''}));
    });
    sel.innerHTML='<option value="">-- Select a room --</option>';
    for(const [rid,info] of auctionRooms){
      const nameSnap=await get(ref(db,`auctions/${rid}/roomName`));
      const name=nameSnap.val()||info.name||'Untitled room';
      const osSnap=await get(ref(db,`auctions/${rid}/maxOverseas`));
      const curOs=osSnap.val()??8;
      const o=document.createElement('option');
      o.value='auction:'+rid;
      o.textContent=`${name}  ·  (${info.ownerEmail||'—'})  ·  auction  ·  ${rid.substring(0,6)}  ·  OS:${curOs}`;
      sel.appendChild(o);
    }
    for(const [rid,info] of draftRooms){
      const nameSnap=await get(ref(db,`drafts/${rid}/roomName`));
      const name=nameSnap.val()||info.name||'Untitled room';
      const osSnap=await get(ref(db,`drafts/${rid}/maxOverseas`));
      const curOs=osSnap.val()??8;
      const o=document.createElement('option');
      o.value='draft:'+rid;
      o.textContent=`${name}  ·  (${info.ownerEmail||'—'})  ·  draft  ·  ${rid.substring(0,6)}  ·  OS:${curOs}`;
      sel.appendChild(o);
    }
  }catch(e){console.error('saPopulateOsRooms:',e);}
};

window.saSetOverseasLimit=async function(){
  const raw=document.getElementById('saOsRoomSelect')?.value||'';
  const limit=parseInt(document.getElementById('saOsLimit')?.value)||8;
  const st=document.getElementById('saOsStatus');
  if(!raw){if(st){st.className='ai-status fail';st.textContent='Select a room first.';}return;}
  if(limit<1||limit>15){if(st){st.className='ai-status fail';st.textContent='Limit must be 1-15.';}return;}
  if(st){st.className='ai-status parsing';st.textContent='Applying...';}
  const parts=raw.split(':');
  const type=parts[0];
  const rid=parts.slice(1).join(':');
  const basePath=type==='draft'?'drafts':'auctions';
  try{
    const upd={};
    upd[`${basePath}/${rid}/maxOverseas`]=limit;
    upd[`${basePath}/${rid}/setup/maxOverseas`]=limit;
    await update(ref(db),upd);
    if(st){st.className='ai-status done';st.textContent=`Overseas limit set to ${limit} for ${type} room — takes effect immediately.`;}
    await window.saPopulateOsRooms();
  }catch(e){if(st){st.className='ai-status fail';st.textContent=`\u274c ${e.message}`;}}
};

// -- SA: XI Multiplier Tool --
window.saPopulateMultRooms=async function(){
  const sel=document.getElementById('saMultRoomSelect');
  if(!sel) return;
  try{
    const usersSnap=await get(ref(db,'users'));
    const users=usersSnap.val()||{};
    const auctionRooms=new Map(), draftRooms=new Map();
    Object.values(users).forEach(u=>{
      const em=u.email||'';
      if(u.auctions) Object.entries(u.auctions).forEach(([rid,r])=>auctionRooms.set(rid,{ownerEmail:r?.email||em,name:r?.name||r?.roomName||''}));
      if(u.drafts) Object.entries(u.drafts).forEach(([rid,r])=>draftRooms.set(rid,{ownerEmail:r?.email||em,name:r?.name||r?.roomName||''}));
    });
    sel.innerHTML='<option value="">-- Select a room --</option>';
    for(const [rid,info] of auctionRooms){
      const ns=await get(ref(db,`auctions/${rid}/roomName`));
      const ms=await get(ref(db,`auctions/${rid}/xiMultiplier`));
      const name=ns.val()||info.name||'Untitled room';
      const o=document.createElement('option');
      o.value='auction:'+rid;
      o.textContent=`${name}  ·  (${info.ownerEmail||'—'})  ·  auction  ·  ${rid.substring(0,6)}  ·  XI:${ms.val()??1}x`;
      sel.appendChild(o);
    }
    for(const [rid,info] of draftRooms){
      const ns=await get(ref(db,`drafts/${rid}/roomName`));
      const ms=await get(ref(db,`drafts/${rid}/xiMultiplier`));
      const name=ns.val()||info.name||'Untitled room';
      const o=document.createElement('option');
      o.value='draft:'+rid;
      o.textContent=`${name}  ·  (${info.ownerEmail||'—'})  ·  draft  ·  ${rid.substring(0,6)}  ·  XI:${ms.val()??1}x`;
      sel.appendChild(o);
    }
  }catch(e){console.error('saPopulateMultRooms:',e);}
};

window.saSetXiMultiplier=async function(){
  const raw=document.getElementById('saMultRoomSelect')?.value||'';
  const mult=parseFloat(document.getElementById('saXiMultValue')?.value);
  const st=document.getElementById('saMultStatus');
  if(!raw){if(st){st.className='ai-status fail';st.textContent='Select a room first.';}return;}
  if(isNaN(mult)||mult<0.5||mult>5){if(st){st.className='ai-status fail';st.textContent='Multiplier must be between 0.5 and 5.';}return;}
  if(st){st.className='ai-status parsing';st.textContent='Applying...';}
  const parts=raw.split(':');
  const type=parts[0];
  const rid=parts.slice(1).join(':');
  const basePath=type==='draft'?'drafts':'auctions';
  try{
    await set(ref(db,`${basePath}/${rid}/xiMultiplier`),mult);
    if(st){st.className='ai-status done';st.textContent=`XI multiplier set to ${mult}x for ${type} room. Leaderboard will recalculate automatically.`;}
    await window.saPopulateMultRooms();
  }catch(e){if(st){st.className='ai-status fail';st.textContent=`\u274c ${e.message}`;}}
};

function renderPlayersSeasonDraft(data){
  if(!data) return;
  const grid=document.getElementById('playerSeasonGridD');
  if(!grid) return;
  const matches=data.matches||{};
  const sortedMatches=Object.entries(matches).sort((a,b)=>(a[1].timestamp||0)-(b[1].timestamp||0));
  const matchCount=sortedMatches.length;

  const playerMatchPts={};
  sortedMatches.forEach(([mid,m],mi)=>{
    if(!m?.players) return;
    Object.values(m.players).forEach(p=>{
      const key=(p.name||'').toLowerCase();
      if(!key) return;
      if(!playerMatchPts[key]) playerMatchPts[key]=new Array(matchCount).fill(null);
      playerMatchPts[key][mi]=(p.pts||0);
    });
  });

  const teams=data.teams?Object.values(data.teams):[];
  if(!teams.length){grid.innerHTML='<div class="pst-no-data">No teams yet.</div>';return;}
  if(!matchCount){grid.innerHTML='<div class="pst-no-data">No match data yet -- add scorecards in the Points tab.</div>';return;}

  const matchHeaders=sortedMatches.map(([mid,m],i)=>`<th>M${i+1}<div style="font-size:.56rem;font-weight:400;color:var(--dim);text-transform:none;letter-spacing:0;max-width:80px;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(m.label||mid)}">${escapeHtml((m.label||mid).substring(0,12)+(m.label&&m.label.length>12?'...':''))}</div></th>`).join('');

  grid.innerHTML=teams.map(team=>{
    const roster=Array.isArray(team.roster)?team.roster:Object.values(team.roster||{});
    if(!roster.length) return `<div class="pst-team-section"><div class="pst-team-hdr"><span class="pst-team-name">${team.name}</span></div><div class="pst-wrap"><div class="pst-no-data">No players</div></div></div>`;
    let teamTotal=0;
    const rows=roster.map(p=>{
      const key=(p.name||'').toLowerCase();
      const ptsArr=playerMatchPts[key]||new Array(matchCount).fill(null);
      const total=ptsArr.reduce((s,v)=>s+(v||0),0);
      teamTotal+=total;
      const cells=ptsArr.map(v=>v===null?`<td class="pst-pts-zero">--</td>`:`<td class="${v>0?'pst-pts-cell':'pst-pts-zero'}">${v>0?'+':''}${v}</td>`).join('');
      const iplTeam=p.iplTeam||p.t||'';
      const isOs=p.isOverseas||p.o;
      return `<tr>
        <td style="cursor:pointer;" onclick="window.showPlayerModal('${escapeHtml(p.name||'')}')">${escapeHtml(p.name||'--')}${iplTeam?`<span class="pst-iplteam">${iplTeam}</span>`:''}${isOs?'<span class="pst-os">OS</span>':''}</td>
        ${cells}
        <td class="pst-total-cell">+${total}</td>
      </tr>`;
    }).join('');
    return `<div class="pst-team-section">
      <div class="pst-team-hdr">
        <span class="pst-team-name">${team.name}</span>
        <span class="pst-owner">${roster.length} players</span>
        <span style="margin-left:auto;font-size:.78rem;font-weight:600;color:var(--ok)">Total: +${teamTotal} pts</span>
      </div>
      <div class="pst-wrap"><table class="pst-table">
        <thead><tr><th>Player</th>${matchHeaders}<th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
  }).join('');
}


// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// ═══════════════════════════════════════════════════════════════════
// IPL 2026 — STATIC DATA (zero API calls — baked in at build time)
// Player imageIds from Cricbuzz: https://cricbuzz-cricket.p.rapidapi.com/img/v1/i1/c{id}/i.jpg
// ═══════════════════════════════════════════════════════════════════
const IPL_SERIES_ID = 9241;
const IPL_TEAM_META = {
  CSK:  {logoImgId:860038, color:'#FCBE03', full:'Chennai Super Kings'},
  DC:   {logoImgId:860040, color:'#282968', full:'Delhi Capitals'},
  GT:   {logoImgId:860068, color:'#1C1C1C', full:'Gujarat Titans'},
  RCB:  {logoImgId:860056, color:'#EC1C24', full:'Royal Challengers Bengaluru'},
  PBKS: {logoImgId:860084, color:'#A72056', full:'Punjab Kings'},
  KKR:  {logoImgId:860046, color:'#3A225D', full:'Kolkata Knight Riders'},
  SRH:  {logoImgId:860066, color:'#F7A721', full:'Sunrisers Hyderabad'},
  RR:   {logoImgId:860055, color:'#2D4FA3', full:'Rajasthan Royals'},
  LSG:  {logoImgId:882545, color:'#A5CFEF', full:'Lucknow Super Giants'},
  MI:   {logoImgId:860053, color:'#004BA0', full:'Mumbai Indians'},
};
// Normalized player name → Cricbuzz imageId (174146 = generic placeholder)
const CBZ_PLAYER_IMG = {
  "ruturaj gaikwad":781069,"ms dhoni":170677,"dewald brevis":846104,"ayush mhatre":826116,
  "anshul kamboj":731465,"jamie overton":848546,"ramakrishna ghosh":781087,"shivam dube":846034,
  "khaleel ahmed":655386,"noor ahmad":616569,"mukesh choudhary":781085,"shreyas gopal":226505,
  "sanju samson":846035,"akeal hosein":845497,"matthew short":619877,"sarfaraz khan":591955,
  "rahul chahar":226225,"matt henry":845495,"zakary foulkes":829852,"zak foulkes":829852,
  "spencer johnson":619884,"kl rahul":616523,"karun nair":717781,"tristan stubbs":846116,
  "axar patel":846033,"mitchell starc":352462,"t natarajan":198676,"t. natarajan":198676,
  "dushmantha chameera":847167,"kuldeep yadav":846039,"nitish rana":171047,
  "ben duckett":845942,"david miller":846103,"pathum nissanka":847160,"lungi ngidi":846112,
  "prithvi shaw":781077,"kyle jamieson":845508,"shubman gill":616515,"sai sudharsan":717782,
  "kumar kushagra":594227,"anuj rawat":226472,"jos buttler":848523,"nishant sindhu":594229,
  "glenn phillips":845521,"washington sundar":616522,"shahrukh khan":226465,
  "rahul tewatia":196288,"kagiso rabada":846108,"mohammed siraj":591952,
  "prasidh krishna":591958,"ishant sharma":154520,"rashid khan":845423,"sai kishore":226507,
  "ravisrinivasan sai kishore":226507,"jayant yadav":226388,"jason holder":845501,
  "tom banton":848526,"luke wood":848539,"ajinkya rahane":332892,"rinku singh":846030,
  "angkrish raghuvanshi":626309,"manish pandey":171022,"rovman powell":845516,
  "anukul roy":593785,"sunil narine":152654,"varun chakaravarthy":846040,"umran malik":594197,
  "cameron green":845943,"matheesha pathirana":847143,"finn allen":845498,
  "prashant solanki":788083,"kartik tyagi":593781,"rahul tripathi":788087,
  "tim seifert":845504,"rachin ravindra":845519,"blessing muzarabani":847098,
  "navdeep saini":226400,"rishabh pant":616524,"abdul samad":226276,"aiden markram":846099,
  "matthew breetzke":597838,"nicholas pooran":244722,"mitchell marsh":845760,
  "shahbaz ahmed":226473,"shahbaz ahamad":226473,"arshin kulkarni":781896,
  "avesh khan":593807,"arjun tendulkar":154048,"mohammed shami":616526,
  "anrich nortje":846100,"wanindu hasaranga":847146,"josh inglis":845950,
  "rohit sharma":616514,"suryakumar yadav":846028,"surya kumar yadav":846028,
  "ryan rickelton":846115,"tilak varma":846029,"hardik pandya":846032,
  "mitchell santner":845505,"will jacks":848529,"corbin bosch":846101,"raj bawa":226295,
  "trent boult":351612,"jasprit bumrah":846037,"deepak chahar":226392,
  "am ghazanfar":737997,"allah ghazanfar":737997,"mayank markande":226510,
  "shardul thakur":352487,"sherfane rutherford":845523,"quinton de kock":846114,
  "shreyas iyer":616518,"harnoor singh":226292,"harnoor pannu":226292,
  "prabhsimran singh":226515,"marcus stoinis":845974,"harpreet brar":226471,
  "marco jansen":846113,"azmatullah omarzai":845424,"musheer khan":581691,
  "mitchell owen":719474,"mitch owen":719474,"arshdeep singh":846038,
  "yuzvendra chahal":244981,"vijaykumar vyshak":594320,"vyshak vijaykumar":594320,
  "xavier bartlett":845954,"lockie ferguson":845492,"cooper connolly":845942,
  "ben dwarshuis":845955,"praveen dubey":195872,"pravin dubey":195872,
  "vaibhav sooryavanshi":826114,"vaibhav suryavanshi":826114,
  "lhuan-dre pretorius":735979,"shimron hetmyer":846142,"yashasvi jaiswal":591942,
  "dhruv jurel":591954,"riyan parag":156160,"jofra archer":848536,
  "tushar deshpande":190903,"sandeep sharma":153909,"kwena maphaka":846111,
  "nandre burger":616020,"ravindra jadeja":616520,"sam curran":848530,
  "donovan ferreira":597841,"ravi bishnoi":226280,"adam milne":244816,
  "dasun shanaka":849378,"rajat patidar":760758,"virat kohli":616517,
  "tim david":845940,"devdutt padikkal":591960,"philip salt":848522,"phil salt":848522,
  "jitesh sharma":226474,"krunal pandya":171069,"jacob bethell":848524,
  "romario shepherd":845509,"josh hazlewood":845819,"bhuvneshwar kumar":244967,
  "nuwan thushara":226338,"venkatesh iyer":226278,"jacob duffy":845524,
  "jordan cox":593790,"kanishk chouhan":826110,"vihaan malhotra":826112,"vicky ostwal":781081,
  "travis head":845768,"abhishek sharma":846031,"ishan kishan":846036,
  "heinrich klaasen":619866,"nitish kumar reddy":591947,"kamindu mendis":847173,
  "harshal patel":594314,"brydon carse":717796,"pat cummins":352460,
  "jaydev unadkat":332903,"liam livingstone":617405,"shivam mavi":155147,
  "david payne":157435,
};

// ── Cricbuzz image cache — fetch once per session, store as data-URL ──
const _cbzImgCache = {};
async function cbzGetImg(imgId){
  if(!imgId || imgId===174146) return null;
  const key='cbzimg_'+imgId;
  if(_cbzImgCache[key]) return _cbzImgCache[key];
  try{
    const cached=sessionStorage.getItem(key);
    if(cached){ _cbzImgCache[key]=cached; return cached; }
  }catch{}
  try{
    const res=await fetch('https://cricbuzz-cricket.p.rapidapi.com/img/v1/i1/c'+imgId+'/i.jpg',{
      headers:{'x-rapidapi-host':'cricbuzz-cricket.p.rapidapi.com','x-rapidapi-key':'6d53928bfdmsh545332aded830a3p11bdaajsncf079fc57095'}
    });
    if(!res.ok) return null;
    const blob=await res.blob();
    return new Promise(resolve=>{
      const reader=new FileReader();
      reader.onloadend=()=>{
        _cbzImgCache[key]=reader.result;
        try{ sessionStorage.setItem(key,reader.result); }catch{}
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  }catch{ return null; }
}

// ── Player name → imgId lookup ──
function cbzPlayerImgId(rawName){
  const norm=(rawName||'').replace(/\*\s*\([^)]+\)/g,'').trim().toLowerCase();
  return CBZ_PLAYER_IMG[norm]||174146;
}

// ── Render avatar chip — renders placeholder, lazy-loads photo ──
function cbzAvatar(rawName, size=28, extraStyle=''){
  const imgId=cbzPlayerImgId(rawName);
  const uid='cbzav_'+Math.random().toString(36).slice(2,9);
  const initials=(rawName||'?').replace(/\*\s*\([^)]+\)/g,'').trim()
    .split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
  if(imgId && imgId!==174146){
    // Lazy load after render
    setTimeout(async()=>{
      const el=document.getElementById(uid);
      if(!el) return;
      const url=await cbzGetImg(imgId);
      if(url) el.innerHTML=`<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    },0);
  }
  return `<span class="cbz-avatar" id="${uid}" style="width:${size}px;height:${size}px;${extraStyle}">${imgId===174146?initials:''}</span>`;
}

// ── Team logo chip ──
function cbzTeamLogo(teamShort, size=32){
  const meta=IPL_TEAM_META[teamShort];
  if(!meta) return `<span class="cbz-avatar" style="width:${size}px;height:${size}px;background:var(--surface2);">${teamShort}</span>`;
  const uid='cbzlogo_'+Math.random().toString(36).slice(2,9);
  setTimeout(async()=>{
    const el=document.getElementById(uid);
    if(!el) return;
    const url=await cbzGetImg(meta.logoImgId);
    if(url) el.innerHTML=`<img src="${url}" alt="${teamShort}" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`;
  },0);
  return `<span class="cbz-avatar cbz-logo" id="${uid}" style="width:${size}px;height:${size}px;background:${meta.color}20;border-color:${meta.color}40;">${teamShort}</span>`;
}

// CRICBUZZ LIVE IMPORT -- Draft Super Admin
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
const CBZ_KEY_D  = '6d53928bfdmsh545332aded830a3p11bdaajsncf079fc57095';
const CBZ_HOST_D = 'cricbuzz-cricket.p.rapidapi.com';
const CBZ_BASE_D = 'https://cricbuzz-cricket.p.rapidapi.com';

let cbzDSelectedMatchId = null;
let cbzDSelectedMatchLabel = '';
let cbzDParsedScorecard = null;
let cbzDActiveInningsIdx = 0;

async function cbzDFetch(path){
  const res = await fetch(CBZ_BASE_D + path, {
    method: 'GET',
    headers: {'x-rapidapi-host': CBZ_HOST_D, 'x-rapidapi-key': CBZ_KEY_D}
  });
  if(!res.ok) throw new Error(`HTTP ${res.status} from Cricbuzz API`);
  return res.json();
}

function cbzDSetStatus(id, msg, cls=''){
  const el=document.getElementById(id);
  if(el){ el.textContent=msg; el.className='cbz-status '+(cls||''); }
}

async function cbzDLoadMatches(endpoint){
  cbzDSetStatus('cbzDMatchStatus','Loading matches...','loading');
  document.getElementById('cbzDMatchList').innerHTML='';
  try{
    const data = await cbzDFetch(endpoint);
    const allMatches=[];
    (data.typeMatches||[]).forEach(type=>{
      (type.seriesMatches||[]).forEach(sm=>{
        const series=sm.seriesAdWrapper||sm;
        (series.matches||[]).forEach(m=>{
          const mi=m.matchInfo||{};
          const ms=m.matchScore||{};
          allMatches.push({
            matchId: mi.matchId,
            teams: `${mi.team1?.teamSName||mi.team1?.teamsname||'?'} vs ${mi.team2?.teamSName||mi.team2?.teamsname||'?'}`,
            series: series.seriesName||mi.seriesName||series.seriesname||mi.seriesname||'',
            venue: mi.venueInfo?.ground||mi.venueinfo?.ground||'',
            state: mi.state||'',
            score1: ms.team1Score?.inngs1?`${ms.team1Score.inngs1.runs}/${ms.team1Score.inngs1.wickets}`:'',
            score2: ms.team2Score?.inngs1?`${ms.team2Score.inngs1.runs}/${ms.team2Score.inngs1.wickets}`:'',
          });
        });
      });
    });
    if(!allMatches.length){ cbzDSetStatus('cbzDMatchStatus','No matches found.','fail'); return; }
    cbzDSetStatus('cbzDMatchStatus',`${allMatches.length} match${allMatches.length===1?'':'es'} loaded -- click one to select.`,'done');
    const grid=document.getElementById('cbzDMatchList');
    grid.innerHTML='';
    allMatches.forEach(m=>{
      const pill=document.createElement('div');
      pill.className='match-pill';
      const scores=m.score1||m.score2?`${m.score1} -- ${m.score2}`:'';
      const isLive=m.state==='In Progress'||m.state==='live';
      pill.innerHTML=`
        <div class="match-pill-teams">${m.teams}</div>
        ${scores?`<div class="match-pill-meta">${scores}</div>`:''}
        ${isLive?'<div class="match-pill-live">LIVE</div>':''}
        <div class="match-pill-meta" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;">${m.series.substring(0,22)}${m.series.length>22?'...':''}</div>`;
      pill.onclick=()=>{
        document.querySelectorAll('#cbzDMatchList .match-pill').forEach(p=>p.classList.remove('selected'));
        pill.classList.add('selected');
        cbzDSelectedMatchId=m.matchId;
        cbzDSelectedMatchLabel=m.teams;
        document.getElementById('cbzDSelectedMatchLabel').textContent=m.teams;
        document.getElementById('cbzDSelectedMatchMeta').textContent=m.series+(m.venue?' . '+m.venue:'');
        document.getElementById('cbzDStep2').style.display='block';
        document.getElementById('cbzDStep3').style.display='none';
        document.getElementById('cbzDStep4').style.display='none';
        cbzDSetStatus('cbzDScorecardStatus','');
      };
      grid.appendChild(pill);
    });
  }catch(e){ cbzDSetStatus('cbzDMatchStatus',`\u274c ${e.message}`,'fail'); }
}

window.cbzDFetchLive     = ()=>cbzDLoadMatches('/matches/v1/live');
window.cbzDFetchRecent   = ()=>cbzDLoadMatches('/matches/v1/recent');
window.cbzDFetchUpcoming = ()=>cbzDLoadMatches('/matches/v1/upcoming');

window.cbzDFetchScorecard = async function(){
  if(!cbzDSelectedMatchId) return;
  cbzDSetStatus('cbzDScorecardStatus','Fetching scorecard...','loading');
  document.getElementById('cbzDStep3').style.display='none';
  document.getElementById('cbzDStep4').style.display='none';
  try{
    const [scardData,infoData]=await Promise.all([
      cbzDFetch(`/mcenter/v1/${cbzDSelectedMatchId}/scard`),
      cbzDFetch(`/mcenter/v1/${cbzDSelectedMatchId}`),
    ]);

    // -- Match meta -- flat object, no matchHeader --
    const winnerTeam = (infoData.shortstatus||'').replace(' won','').trim();
    const resultStr  = infoData.state==='Complete'?'normal':'noresult';
    const matchLbl   = `${cbzDSelectedMatchLabel} -- ${infoData.seriesname||''}`;

    // -- Innings -- scorecard (lowercase) --
    const innings=[];
    (scardData.scorecard||[]).forEach((inn,ii)=>{
      const innLabel = inn.batteamname||`Innings ${ii+1}`;
      const batting=[]; const bowling=[]; const fielding={};

      (inn.batsman||[]).forEach(b=>{
        const outdec=b.outdec||'';
        const dismissal=!outdec?'notout':
          outdec.toLowerCase().includes('run out')?'runout':
          outdec.toLowerCase().includes('stumped')?'stumped':
          outdec.toLowerCase().includes('not out')?'notout':'out';
        batting.push({name:b.name,runs:b.runs,balls:b.balls,fours:b.fours,sixes:b.sixes,sr:b.strkrate,dismissal});
        // Helper: add to fielding object
        const addF=(f,type)=>{f=f.replace(/^[†\s]+/,'').trim();if(!f)return;if(!fielding[f])fielding[f]={name:f,catches:0,stumpings:0,runouts:0};fielding[f][type]++;};
        // Caught & bowled: "c & b Bowler" or "c and b Bowler" — fielder IS the bowler
        const cnbM=outdec.match(/^c\s*(?:&|and)\s*b\s+(.+)/i);
        // Regular catch: "c [†]Fielder b Bowler" — dagger optional, must NOT match c&b
        const catchM=!cnbM&&outdec.match(/^c\s+\u2020?([^b][^]*?)\s+b\s+\S/i);
        // Stumping: "st [†]Fielder b Bowler" — dagger optional
        const stumpM=outdec.match(/^st\s+\u2020?([^b][^]*?)\s+b\s+\S/i);
        // Run-out: "run out (Fielder)" or "run out (Fielder/Assist)" — credit all fielders
        const roM=outdec.match(/run out[^(]*\(([^)]+)\)/i);
        if(cnbM){addF(cnbM[1].trim(),'catches');}
        if(catchM){addF(catchM[1].trim(),'catches');}
        if(stumpM){addF(stumpM[1].trim(),'stumpings');}
        if(roM){roM[1].split('/').forEach(f=>addF(f.trim(),'runouts'));}
      });

      (inn.bowler||[]).forEach(bw=>{
        const eco=parseFloat(bw.economy)||0;
        bowling.push({name:bw.name,overs:bw.overs,runs:bw.runs,wickets:bw.wickets,economy:eco.toFixed(2),econ:eco.toFixed(2),economyRate:eco.toFixed(2),dots:bw.dots||0,maidens:bw.maidens||0});
      });

      innings.push({inningsLabel:innLabel,batting,bowling,fielding:Object.values(fielding)});
    });

    cbzDParsedScorecard={innings,winnerTeam,resultStr,matchLbl};
    cbzDSetStatus('cbzDScorecardStatus',`\u2705 Scorecard loaded -- ${innings.length} innings found.`,'done');

    const btnContainer=document.getElementById('cbzDInningsButtons');
    btnContainer.innerHTML='';
    innings.forEach((inn,i)=>{
      const btn=document.createElement('button');
      btn.className='btn btn-sm '+(i===0?'btn-cta':'btn-outline');
      btn.style.width='auto'; btn.textContent=inn.inningsLabel;
      btn.onclick=()=>{
        cbzDActiveInningsIdx=i;
        btnContainer.querySelectorAll('button').forEach((b,bi)=>b.className='btn btn-sm '+(bi===i?'btn-cta':'btn-outline'));
        cbzDRenderPreview(i);
      };
      btnContainer.appendChild(btn);
    });
    document.getElementById('cbzDStep3').style.display='block';
    cbzDRenderAllInnings();
    document.getElementById('cbzDStep4').style.display='block';
  }catch(e){ cbzDSetStatus('cbzDScorecardStatus',`\u274c ${e.message}`,'fail'); }
};

function cbzDRenderPreview(idx){
  const inn=cbzDParsedScorecard?.innings?.[idx];
  if(!inn) return;
  const prev=document.getElementById('cbzDPreview');
  let html=`<div class="cbz-inn-header">${inn.inningsLabel} -- Batting</div>
  <table class="cbz-preview-table"><thead><tr><th>Player</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th><th>Dismissal</th></tr></thead>
  <tbody>${inn.batting.map(b=>`<tr><td><strong>${b.name}</strong></td><td>${b.runs}</td><td>${b.balls}</td><td>${b.fours}</td><td>${b.sixes}</td><td>${b.sr||'--'}</td><td style="font-size:.72rem;color:var(--dim)">${b.dismissal}</td></tr>`).join('')}</tbody></table>
  <div class="cbz-inn-header" style="margin-top:12px;">Bowling</div>
  <p style="font-size:.70rem;color:var(--warn);margin:4px 0 6px;">\u26a0 Dot balls not available from API -- enter manually in the Scorecards form.</p>
  <table class="cbz-preview-table"><thead><tr><th>Bowler</th><th>Ov</th><th>R</th><th>W</th><th>Eco</th><th>Mdns</th></tr></thead>
  <tbody>${inn.bowling.map(b=>`<tr><td><strong>${b.name}</strong></td><td>${b.overs}</td><td>${b.runs}</td><td>${b.wickets}</td><td>${b.economy}</td><td>${b.maidens}</td></tr>`).join('')}</tbody></table>`;
  if(inn.fielding.length){
    html+=`<div class="cbz-inn-header" style="margin-top:12px;">Fielding</div>
    <table class="cbz-preview-table"><thead><tr><th>Player</th><th>Catches</th><th>Stumpings</th><th>Run-outs</th></tr></thead>
    <tbody>${inn.fielding.map(f=>`<tr><td>${f.name}</td><td>${f.catches||0}</td><td>${f.stumpings||0}</td><td>${f.runouts||0}</td></tr>`).join('')}</tbody></table>`;
  }
  prev.innerHTML=html;
}

window.cbzDPushToForm = function(){
  const innings=cbzDParsedScorecard?.innings||[];
  if(!innings.length){ cbzDSetStatus('cbzDPushStatus','No innings data loaded.','fail'); return; }
  cbzDSetStatus('cbzDPushStatus','Populating Scorecards tab with all innings...','loading');

  // Scroll to scorecards section (scroll layout — no tab switching)
  const _scEl=document.getElementById('tab-scorecards');
  if(_scEl) _scEl.scrollIntoView({behavior:'smooth',block:'start'});

  setTimeout(()=>{
    const fb=document.getElementById('gscFormBody');
    if(fb) fb.style.display='block';

    const sv=(id,v)=>{ const el=document.getElementById(id); if(el&&v!=null&&v!=='') el.value=v; };

    // Meta fields
    sv('gscMatchLabel', cbzDParsedScorecard.matchLbl);
    sv('gscWinner',     cbzDParsedScorecard.winnerTeam);
    const res=document.getElementById('gscResult');
    if(res&&cbzDParsedScorecard.resultStr)
      [...res.options].forEach(o=>{ if(o.value===cbzDParsedScorecard.resultStr) o.selected=true; });

    // -- Simple concatenation: Inn1 first, Inn2 after --
    // Batting: all batsmen from Inn1, then all batsmen from Inn2
    const allBatting  = innings.flatMap(inn=>(inn.batting||[]));
    // Bowling: all bowlers from Inn1, then all bowlers from Inn2
    const allBowling  = innings.flatMap(inn=>(inn.bowling||[]));
    // Fielding: all fielders from Inn1, then all fielders from Inn2
    const allFielding = innings.flatMap(inn=>(inn.fielding||[]));

    // Clear and reset
    document.getElementById('gscBattingRows').innerHTML='';
    document.getElementById('gscBowlingRows').innerHTML='';
    document.getElementById('gscFieldingRows').innerHTML='';
    gscBattingCount=0; gscBowlingCount=0; gscFieldingCount=0;

    // Populate batting (Inn1 batsmen first, then Inn2 batsmen)
    allBatting.forEach(b=>{
      window.addGscBattingRow();
      const id=gscBattingCount-1;
      sv(`gscbr${id}name`,  b.name||'');
      sv(`gscbr${id}runs`,  b.runs??'');
      sv(`gscbr${id}balls`, b.balls??'');
      sv(`gscbr${id}fours`, b.fours??'');
      sv(`gscbr${id}sixes`, b.sixes??'');
      const dis=document.getElementById(`gscbr${id}dis`);
      if(dis)[...dis.options].forEach(o=>{ if(o.value===(b.dismissal||'out')) o.selected=true; });
    });

    // Populate bowling (Inn1 bowlers first, then Inn2 bowlers)
    allBowling.forEach(bw=>{
      window.addGscBowlingRow();
      const id=gscBowlingCount-1;
      sv(`gscbow${id}name`,   bw.name||'');
      sv(`gscbow${id}overs`,  bw.overs??'');
      sv(`gscbow${id}runs`,   bw.runs??'');
      sv(`gscbow${id}wkts`,   bw.wickets??'');
      sv(`gscbow${id}maidens`,bw.maidens??'');
      if(bw.economy){
        const eEl=document.getElementById(`gscbow${id}eco`);
        if(eEl){ eEl.value=parseFloat(bw.economy).toFixed(2); eEl.dataset.manual='1'; }
      }
    });

    // Populate fielding (Inn1 fielders first, then Inn2 fielders)
    allFielding.forEach(f=>{
      if((f.catches||0)+(f.stumpings||0)+(f.runouts||0)===0) return;
      window.addGscFieldingRow();
      const id=gscFieldingCount-1;
      sv(`gscfld${id}name`,      f.name||'');
      sv(`gscfld${id}catches`,   f.catches||'');
      sv(`gscfld${id}stumpings`, f.stumpings||'');
      sv(`gscfld${id}runouts`,   f.runouts||'');
    });

    cbzDSetStatus('cbzDPushStatus',`\u2705 ${allBatting.length} batters . ${allBowling.length} bowlers . ${allFielding.filter(f=>f.catches||f.stumpings||f.runouts).length} fielders from ${innings.length} innings. Add dot balls then Save & Push.`,'done');
  }, 300);
};;;;;;

// -- Populate draft scorecard form from parsed data --
// Field IDs: batting=brd{n}+[n,r,b,f,s,d] bowling=bowd{n}+[n,o,r,e,w,dots,mdns] fielding=fldd{n}+[n,c,st,ro]
function populateDraftMatchForm(parsed){
  document.getElementById('addMatchCardDraft').style.display='block';
  document.getElementById('matchFormBodyD').style.display='block';
  const sv=(id,v)=>{const el=document.getElementById(id);if(el&&v!==undefined&&v!=='')el.value=v;};
  sv('matchLabelD',parsed.matchLabel);
  sv('mfWinnerD',parsed.winner);
  sv('mfMotmD',parsed.motm);
  const res=document.getElementById('mfResultD');
  if(res&&parsed.result)[...res.options].forEach(o=>{if(o.value===parsed.result)o.selected=true;});
  // Clear rows
  document.getElementById('battingRowsD').innerHTML='';
  document.getElementById('bowlingRowsD').innerHTML='';
  document.getElementById('fieldingRowsD').innerHTML='';
  brD=0; bowD=0; fldD=0;
  // Batting -- prefix: brd, fields: n r b f s d(dismissal)
  (parsed.batting||[]).forEach(bat=>{
    window.addBattingRowD();
    const id=`brd${brD-1}`;
    sv(`${id}n`,bat.name||'');
    sv(`${id}r`,bat.runs??'');
    sv(`${id}b`,bat.balls??'');
    sv(`${id}f`,bat.fours??'');
    sv(`${id}s`,bat.sixes??'');
    const dis=document.getElementById(`${id}d`);
    if(dis)[...dis.options].forEach(o=>{if(o.value===(bat.dismissal||'out'))o.selected=true;});
  });
  // Bowling -- prefix: bowd, fields: n o(overs) r e(eco) w + dots mdns
  (parsed.bowling||[]).forEach(bw=>{
    window.addBowlingRowD();
    const id=`bowd${bowD-1}`;
    sv(`${id}n`,bw.name||'');
    sv(`${id}o`,bw.overs??'');
    sv(`${id}r`,bw.runs??'');
    sv(`${id}w`,bw.wickets??'');
    if(bw.economy){const eEl=document.getElementById(`${id}e`);if(eEl){eEl.value=parseFloat(bw.economy).toFixed(2);eEl.dataset.manual='1';}}
  });
  // Fielding -- prefix: fldd, fields: n c st ro(runouts)
  (parsed.fielding||[]).forEach(f=>{
    if((f.catches||0)+(f.stumpings||0)+(f.runouts||0)===0) return;
    window.addFieldingRowD();
    const id=`fldd${fldD-1}`;
    sv(`${id}n`,f.name||'');
    sv(`${id}c`,f.catches||'');
    sv(`${id}st`,f.stumpings||'');
    sv(`${id}ro`,f.runouts||'');
  });
}

// -- Render all innings combined in preview (draft) --
function cbzDRenderAllInnings(){
  const innings=cbzDParsedScorecard?.innings||[];
  const prev=document.getElementById('cbzDPreview');
  if(!prev||!innings.length) return;
  let html='';
  innings.forEach((inn,i)=>{
    html+=`<div class="cbz-inn-header" style="${i>0?'margin-top:18px;border-top:1px solid var(--b1);padding-top:12px;':''}"> ${inn.inningsLabel} -- Batting</div>
    <table class="cbz-preview-table">
      <thead><tr><th>Player</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th><th>Dismissal</th></tr></thead>
      <tbody>${inn.batting.map(b=>`<tr><td><strong>${b.name}</strong></td><td>${b.runs}</td><td>${b.balls}</td><td>${b.fours}</td><td>${b.sixes}</td><td>${b.sr||'--'}</td><td style="font-size:.72rem;color:var(--dim)">${b.dismissal}</td></tr>`).join('')}</tbody>
    </table>
    <div class="cbz-inn-header" style="margin-top:10px;">${inn.inningsLabel} -- Bowling</div>
    <p style="font-size:.70rem;color:var(--warn);margin:3px 0 5px;">\u26a0 Dot balls not available from API -- enter manually.</p>
    <table class="cbz-preview-table">
      <thead><tr><th>Bowler</th><th>Ov</th><th>R</th><th>W</th><th>Eco</th><th>Mdns</th></tr></thead>
      <tbody>${inn.bowling.map(b=>`<tr><td><strong>${b.name}</strong></td><td>${b.overs}</td><td>${b.runs}</td><td>${b.wickets}</td><td>${b.economy}</td><td>${b.maidens}</td></tr>`).join('')}</tbody>
    </table>`;
    if(inn.fielding.length){
      html+=`<div class="cbz-inn-header" style="margin-top:10px;">${inn.inningsLabel} -- Fielding</div>
      <table class="cbz-preview-table">
        <thead><tr><th>Player</th><th>Catches</th><th>Stumpings</th><th>Run-outs</th></tr></thead>
        <tbody>${inn.fielding.map(f=>`<tr><td>${f.name}</td><td>${f.catches||0}</td><td>${f.stumpings||0}</td><td>${f.runouts||0}</td></tr>`).join('')}</tbody>
      </table>`;
    }
  });
  prev.innerHTML=html;
}



// MY TEAM D -- simple synchronous render
let _sqSavedD = null; // cached Firebase squad
let _sqHistD  = [];

function _myRosterD(){
  var st = draftState;
  if(!st) return [];
  var tn = (user && st.members && st.members[user.uid] && st.members[user.uid].teamName) || myTeamName || '';
  if(!tn) return [];
  if(!myTeamName && tn) myTeamName = tn;
  var team = st.teams && st.teams[tn];
  if(!team && st.teams){
    var tnL = tn.trim().toLowerCase();
    var match = Object.keys(st.teams).find(function(k){ return k.trim().toLowerCase() === tnL; });
    if(match) team = st.teams[match];
  }
  if(!team) return [];
  var r = team.roster;
  if(!r) return [];
  return Array.isArray(r) ? r : Object.values(r);
}

function _mtRenderD(){
  var el = document.getElementById('mt_body_D');
  if(!el) return;

  var roster = _myRosterD();

  if(!roster.length){
    var st = draftState;
    var tn = (user && st && st.members && st.members[user.uid] && st.members[user.uid].teamName) || myTeamName || '';
    if(!st || !tn){
      el.innerHTML = '<div class="empty"><div style="font-size:2rem;margin-bottom:8px;">&#x1F44B;</div><strong class="text-strong">Register first</strong><br>Go to the Setup tab to get started.</div>';
    } else {
      el.innerHTML = '<div class="empty"><div style="font-size:2rem;margin-bottom:8px;">&#x1F3CF;</div><strong class="text-strong">No players yet</strong><br>Your roster will appear here once players join <strong class="text-accent">' + tn + '</strong>.</div>';
    }
    return;
  }

  function pData(name){ return roster.find(function(x){ return (x.name||x.n||'')===name; })||{}; }
  function pRole(name){ return (pData(name).role||pData(name).r||'').toLowerCase(); }
  function pOs(name){ var p=pData(name); return !!(p.isOverseas||p.o||(name.indexOf('* (')>=0)); }
  function canBowl(name){ var r=pRole(name); return r.indexOf('bowler')>=0||r.indexOf('all-rounder')>=0||r.indexOf('all rounder')>=0; }
  function isWk(name){ var r=pRole(name); return r.indexOf('wicketkeeper')>=0||r.indexOf('keeper')>=0; }

  var allNames = roster.map(function(p){ return p.name||p.n||''; });

  var sq = _sqSavedD;
  if(!sq || !sq.xi){
    var _xiEnd = Math.min(11, allNames.length);
    var _benchEnd = Math.min(_xiEnd + 5, allNames.length);
    sq = { xi: allNames.slice(0, _xiEnd), bench: allNames.slice(_xiEnd, _benchEnd), reserves: allNames.slice(_benchEnd) };
  } else {
    var assigned = new Set(sq.xi.concat(sq.bench).concat(sq.reserves));
    allNames.forEach(function(n){ if(!assigned.has(n)) sq.reserves.push(n); });
    sq.xi       = sq.xi.filter(function(n){ return allNames.indexOf(n)>=0; });
    sq.bench    = sq.bench.filter(function(n){ return allNames.indexOf(n)>=0; });
    sq.reserves = sq.reserves.filter(function(n){ return allNames.indexOf(n)>=0; });
  }

  var playing16Os = sq.xi.filter(pOs).concat(sq.bench.filter(pOs));
  while(playing16Os.length > 6){
   var victim = null;
   var benchOs = sq.bench.filter(pOs);
   if(benchOs.length > 0){ victim = benchOs[benchOs.length-1]; sq.bench = sq.bench.filter(function(n){return n!==victim;}); }
   else { var xiOs = sq.xi.filter(pOs); victim = xiOs[xiOs.length-1]; sq.xi = sq.xi.filter(function(n){return n!==victim;}); }
   sq.reserves.push(victim);
   playing16Os = sq.xi.filter(pOs).concat(sq.bench.filter(pOs));
  }

  sq._rLen = allNames.length; _sqSavedD = sq;

  var xiCount = sq.xi.length, benchCount = sq.bench.length, resCount = sq.reserves.length;
  var xiOsCount = sq.xi.filter(pOs).length;
  var benchOsCount = sq.bench.filter(pOs).length;
  var xiBowlCount = sq.xi.filter(canBowl).length;
  var xiWkCount = sq.xi.filter(isWk).length;

  var totalPlayers = allNames.length;
  var needBench = totalPlayers > 11;
  var xiTarget = Math.min(11, totalPlayers);
  var benchTarget = needBench ? Math.min(5, totalPlayers - 11) : 0;

  var checks = [{ label:'XI Size', val:xiCount+'/'+xiTarget, ok:xiCount===xiTarget }];
  if(needBench) checks.push({ label:'Bench', val:benchCount+'/'+benchTarget, ok:benchCount===benchTarget });
  var p16OsCount = xiOsCount + benchOsCount;
  checks.push({ label:'Overseas (XI+Bench)', val:p16OsCount+'/6 max', ok:p16OsCount<=6 });
  if(xiCount>=5) checks.push({ label:'Bowlers XI', val:xiBowlCount+'/5 min', ok:xiBowlCount>=5 });
  checks.push({ label:'Keeper XI', val:xiWkCount+'/1 min', ok:xiWkCount>=1 });
  var allValid = checks.every(function(c){ return c.ok; });
  window._squadValidD = allValid;

  var ptsMap = {};
  var matches = (draftState && draftState.matches) || {};
  Object.values(matches).forEach(function(m){
    if(!m||!m.players) return;
    Object.values(m.players).forEach(function(p){
      var k=(p.name||'').toLowerCase();
      ptsMap[k]=(ptsMap[k]||0)+(p.pts||0);
    });
  });

  // Tracker
  var tHtml = '<div class="mt-checks-grid">';
  checks.forEach(function(c){
    var cls=c.ok?'mt-check-ok':'mt-check-err';
    tHtml += '<div class="mt-check '+cls+'"><div class="mt-check-label">'+(c.ok?'&#10003;':'&#10007;')+' '+c.label+'</div><div class="mt-check-val">'+c.val+'</div></div>';
  });
  tHtml += '</div>';

  var _isLocked=!!(draftState.squadLocked);
  var statusHtml = allValid
    ? '<div class="alert alert--ok">&#10003; Squad valid &mdash; all criteria met</div>'
    : '<div class="alert alert--err">&#10007; Squad not valid &mdash; fix red criteria above.</div>';

  // IPL team jersey colors
  var JERSEY={CSK:'#F9CD05',MI:'#004BA0',RCB:'#EC1C24',KKR:'#3A225D',DC:'#004C93',PBKS:'#ED1B24',RR:'#EA1A85',SRH:'#FF822A',GT:'#1C1C2B',LSG:'#A72056'};

  // Dream11-style player chip on the pitch
  function pitchChip(name){
    var p=pData(name), ipl=(p.iplTeam||p.t||'').toUpperCase(), os=pOs(name);
    var pts=ptsMap[name.toLowerCase()]||0;
    var shortName=name.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
    if(shortName.length>12){var parts=shortName.split(' ');shortName=parts.length>1?parts[0][0]+'. '+parts.slice(1).join(' ').substring(0,10):shortName.substring(0,10)+'...';}
    var safeName=encodeURIComponent(name);
    var ptsCls=pts>0?'pitch-pts-pos':pts<0?'pitch-pts-neg':'pitch-pts-zero';
    var btns=[['bench','B'],['reserves','R']].map(function(tb){
      return '<button data-n="'+safeName+'" data-f="xi" data-t="'+tb[0]+'" onclick="event.stopPropagation();window.mt_move_D(decodeURIComponent(this.dataset.n),this.dataset.f,this.dataset.t)" class="pitch-move-btn">'+tb[1]+'</button>';
    }).join('');
    var _jclr=JERSEY[ipl]||'rgba(255,255,255,.3)';
    var _photoEl=cbzAvatar(name,44,'box-shadow:0 4px 16px rgba(0,0,0,.4),0 0 0 2.5px '+_jclr+';transition:box-shadow .2s;');
    return '<div class="pitch-player" onclick="window.showPlayerModal(\''+escapeHtml(name)+'\')">'
      + '<div style="position:relative;display:inline-flex;">'+_photoEl+(os?'<div class="pitch-os-ring"></div>':'')+'</div>'
      + '<div class="pitch-name">'+shortName+'</div>'
      + '<div class="pitch-pts '+ptsCls+'">'+(pts!==0?((pts>0?'+':'')+pts):'—')+'</div>'
      + '<div class="pitch-actions" onclick="event.stopPropagation()">'+btns+'</div>'
      + '</div>';
  }

  function pitchRow(label, players){
    if(!players.length) return '';
    return '<div class="pitch-row"><div class="pitch-row-label">'+label+'</div><div class="pitch-row-players">'+players.map(pitchChip).join('')+'</div></div>';
  }

  // Group XI by role
  var xiWks=[],xiBats=[],xiArs=[],xiBowls=[];
  sq.xi.forEach(function(n){
    var r=pRole(n);
    if(r.indexOf('wicketkeeper')>=0||r.indexOf('keeper')>=0) xiWks.push(n);
    else if(r.indexOf('all-rounder')>=0||r.indexOf('all rounder')>=0) xiArs.push(n);
    else if(r.indexOf('bowler')>=0) xiBowls.push(n);
    else xiBats.push(n);
  });

  // Cricket ground
  var pitchHtml='<div class="pitch-ground">'
    + '<div class="pitch-strip"></div>'
    + '<div class="pitch-crease pitch-crease-top"></div>'
    + '<div class="pitch-crease pitch-crease-bot"></div>'
    + '<div class="pitch-circle"></div>'
    + '<div class="pitch-content">'
    + pitchRow(roleIcon('Wicketkeeper',18)+' WK', xiWks)
    + pitchRow(roleIcon('Batter',18)+' BAT', xiBats)
    + pitchRow(roleIcon('All-Rounder',18)+' AR', xiArs)
    + pitchRow(roleIcon('Bowler',18)+' BOWL', xiBowls)
    + '</div>'
    + '<div class="pitch-xi-badge">'+xiCount+'/11</div>'
    + '</div>';

  // Off-pitch player card (for bench/reserves)
  function playerCard(name, sec){
    var p=pData(name), role=p.role||p.r||'', ipl=(p.iplTeam||p.t||'').toUpperCase(), os=pOs(name);
    var pts=ptsMap[name.toLowerCase()]||0;
    var shortName=name.replace(/\*?\s*\([^)]*\)\s*$/,'').trim();
    if(shortName.length>14){var parts=shortName.split(' ');shortName=parts.length>1?parts[0][0]+'. '+parts.slice(1).join(' '):shortName.substring(0,12)+'...';}
    var safeName=encodeURIComponent(name);
    var targets=sec==='bench'?[['xi','XI'],['reserves','Res']]:[['xi','XI'],['bench','Bench']];
    var moveHtml=targets.map(function(tb){
      return '<button data-n="'+safeName+'" data-f="'+sec+'" data-t="'+tb[0]+'" onclick="event.stopPropagation();window.mt_move_D(decodeURIComponent(this.dataset.n),this.dataset.f,this.dataset.t)" class="mt-move-btn">'+tb[1]+'</button>';
    }).join('');
    var ptsCls=pts>0?'mt-player-pts-pos':pts<0?'mt-player-pts-neg':'mt-player-pts-zero';
    var _jclr2=JERSEY[ipl]||'rgba(255,255,255,.25)';
    var _cardPhoto=cbzAvatar(name,38,'border-radius:8px !important;border:2px solid '+_jclr2+';');
    return '<div class="mt-player-card" onclick="window.showPlayerModal(\''+escapeHtml(name)+'\')">'
      + '<div style="position:relative;flex-shrink:0;display:inline-flex;">'+_cardPhoto+(os?'<div class="mt-os-dot"></div>':'')+'</div>'
      + '<div class="mt-player-info"><div class="mt-player-name">'+shortName+'</div><div class="mt-player-role">'+roleIcon(role,14)+' '+role+'</div></div>'
      + '<div class="mt-player-pts '+ptsCls+'">'+(pts>0?'+':'')+pts+'</div>'
      + '<div class="mt-move-btns" onclick="event.stopPropagation()">'+moveHtml+'</div>'
      + '</div>';
  }

  function offPitchSection(title,players,key,hdrCls,icon){
    if(!players.length&&key!=='bench') return '';
    return '<div class="mt-section-mt">'
      + '<div class="mt-offpitch-hdr '+hdrCls+'"><span class="mt-offpitch-label">'+icon+' '+title+'</span><span class="mt-offpitch-count">'+players.length+' players</span></div>'
      + '<div class="mt-offpitch-body">'
      + (players.length?players.map(function(n){return playerCard(n,key);}).join(''):'<div class="mt-offpitch-empty">No players</div>')
      + '</div></div>';
  }

  var pxi=document.getElementById('mt_xi_D'); if(pxi) pxi.textContent='XI: '+xiCount+'/11';
  var pbn=document.getElementById('mt_bench_D'); if(pbn) pbn.textContent='Bench: '+benchCount+'/5';
  var prs=document.getElementById('mt_res_D'); if(prs) prs.textContent='Reserves: '+resCount;
  var vl=document.getElementById('mt_val_D'); if(vl) vl.style.display='none';

  var lockBanner=_isLocked?'<div class="mt-lock-banner">Squad changes are LOCKED by admin</div>':'';

  el.innerHTML = lockBanner + statusHtml + tHtml
    + '<div class="mt-pad">'
    + pitchHtml
    + offPitchSection('BENCH',sq.bench,'bench','mt-bench-hdr','&#129681;')
    + offPitchSection('RESERVES',sq.reserves,'reserves','mt-reserves-hdr','&#128230;')
    + '</div>';
}




window.mt_move_D = function(name, from, to){
  if(draftState&&draftState.squadLocked&&!isAdmin){window.showAlert('Squad changes are locked by admin.');return;}
  const sq = _sqSavedD || {xi:[],bench:[],reserves:[]};
  _sqHistD.push(JSON.parse(JSON.stringify(sq)));
  var ub=document.getElementById('mt_undo_D'); if(ub) ub.style.display='flex';
  sq[from] = (sq[from]||[]).filter(function(n){return n!==name;});
  if(!sq[to]) sq[to]=[];
  sq[to].push(name);
  _sqSavedD = sq;
  _mtRenderD();
};

window.mt_undo_D = function(){
  if(!_sqHistD.length) return;
  _sqSavedD = _sqHistD.pop();
  if(!_sqHistD.length){var ub=document.getElementById('mt_undo_D');if(ub)ub.style.display='none';}
  _mtRenderD();
};

window.mt_save_D = async function(){
  if(draftState&&draftState.squadLocked&&!isAdmin){window.showAlert("Squad changes are locked by admin.");return;}
  if(!user||!draftId) return;
  const sq=_sqSavedD;
  if(!sq){window.showAlert('No squad to save.');return;}
  const r=_myRosterD();
  var msgs=[];
  var _xiTarget=Math.min(11,r.length), _needBench=r.length>11, _benchTarget=_needBench?Math.min(5,r.length-11):0;
  if(sq.xi.length!==_xiTarget) msgs.push('XI needs '+_xiTarget+' (has '+sq.xi.length+')');
  if(_needBench&&sq.bench.length!==_benchTarget) msgs.push('Bench needs '+_benchTarget+' (has '+sq.bench.length+')');
  function _pd(name){ return r.find(function(x){ return (x.name||x.n||'')===name; })||{}; }
  function _pr(name){ return (_pd(name).role||_pd(name).r||'').toLowerCase(); }
  function _po(name){ return !!(_pd(name).isOverseas||_pd(name).o); }
  function _cb(name){ var rl=_pr(name); return rl.indexOf('bowler')>=0||rl.indexOf('all-rounder')>=0||rl.indexOf('all rounder')>=0; }
  function _wk(name){ var rl=_pr(name); return rl.indexOf('wicketkeeper')>=0||rl.indexOf('keeper')>=0; }
  var xiOs=sq.xi.filter(_po).length, benchOs=sq.bench.filter(_po).length;
  var xiBowl=sq.xi.filter(_cb).length, xiWk=sq.xi.filter(_wk).length;
  var p16Os=xiOs+benchOs;
  if(p16Os>6) msgs.push('Playing 16 has '+p16Os+' overseas (max 6)');
  if(sq.xi.length===_xiTarget&&_xiTarget>=5&&xiBowl<5) msgs.push('XI needs 5+ bowlers/all-rounders (has '+xiBowl+')');
  if(sq.xi.length===_xiTarget&&xiWk<1) msgs.push('XI needs at least 1 wicketkeeper (has '+xiWk+')');
  if(msgs.length){if(myTeamName)update(ref(db,'drafts/'+draftId+'/teams/'+myTeamName),{squadValid:false,activeSquad:null}).catch(function(){});window.showAlert(msgs.join(' \u00b7 '));return;}
  try{
    await set(ref(db,'users/'+user.uid+'/squads/drafts/'+draftId),{xi:sq.xi,bench:sq.bench,savedAt:Date.now()});
    window.showAlert('Squad saved!','ok');
    if(myTeamName)update(ref(db,'drafts/'+draftId+'/teams/'+myTeamName),{squadValid:true,activeSquad:sq.xi.concat(sq.bench)}).catch(function(){});
    _sqHistD=[];
    var ub=document.getElementById('mt_undo_D');if(ub)ub.style.display='none';
  }catch(e){window.showAlert('Save failed: '+e.message);}
};

// Load saved squad from Firebase then render
window.renderMyTeamD = function(){
  if(_sqSavedD && _sqSavedD.xi){ _mtRenderD(); return; }
  if(user && draftId){
    get(ref(db,'users/'+user.uid+'/squads/drafts/'+draftId))
      .then(function(snap){
        var saved=snap.val();
        if(saved&&saved.xi&&saved.xi.length){
          var allNames=_myRosterD().map(function(p){return p.name||p.n||'';});
          var xi=(saved.xi||[]).filter(function(n){return allNames.indexOf(n)>=0;});
          var bench=(saved.bench||[]).filter(function(n){return allNames.indexOf(n)>=0&&xi.indexOf(n)<0;});
          var assigned=new Set(xi.concat(bench));
          _sqSavedD={xi:xi,bench:bench,reserves:allNames.filter(function(n){return!assigned.has(n);})}; 
        }
        _mtRenderD();
      }).catch(function(){ _mtRenderD(); });
  } else { _mtRenderD(); }
};



var IPL_SCHEDULE=[
{sr:1,date:"28 Mar",t1:"RCB",t2:"SRH",city:"Bengaluru",time:"19:30"},
{sr:2,date:"29 Mar",t1:"MI",t2:"KKR",city:"Mumbai",time:"19:30"},
{sr:3,date:"30 Mar",t1:"RR",t2:"CSK",city:"Guwahati",time:"19:30"},
{sr:4,date:"31 Mar",t1:"PBKS",t2:"GT",city:"Chandigarh",time:"19:30"},
{sr:5,date:"01 Apr",t1:"LSG",t2:"DC",city:"Lucknow",time:"19:30"},
{sr:6,date:"02 Apr",t1:"KKR",t2:"SRH",city:"Kolkata",time:"19:30"},
{sr:7,date:"03 Apr",t1:"CSK",t2:"PBKS",city:"Chennai",time:"19:30"},
{sr:8,date:"04 Apr",t1:"DC",t2:"MI",city:"Delhi",time:"15:30"},
{sr:9,date:"04 Apr",t1:"GT",t2:"RR",city:"Ahmedabad",time:"19:30"},
{sr:10,date:"05 Apr",t1:"SRH",t2:"LSG",city:"Hyderabad",time:"15:30"},
{sr:11,date:"05 Apr",t1:"RCB",t2:"CSK",city:"Bengaluru",time:"19:30"},
{sr:12,date:"06 Apr",t1:"KKR",t2:"PBKS",city:"Kolkata",time:"19:30"},
{sr:13,date:"07 Apr",t1:"RR",t2:"MI",city:"Guwahati",time:"19:30"},
{sr:14,date:"08 Apr",t1:"DC",t2:"GT",city:"Delhi",time:"19:30"},
{sr:15,date:"09 Apr",t1:"KKR",t2:"LSG",city:"Kolkata",time:"19:30"},
{sr:16,date:"10 Apr",t1:"RR",t2:"RCB",city:"Guwahati",time:"19:30"},
{sr:17,date:"11 Apr",t1:"PBKS",t2:"SRH",city:"Chandigarh",time:"15:30"},
{sr:18,date:"11 Apr",t1:"CSK",t2:"DC",city:"Chennai",time:"19:30"},
{sr:19,date:"12 Apr",t1:"LSG",t2:"GT",city:"Lucknow",time:"15:30"},
{sr:20,date:"12 Apr",t1:"MI",t2:"RCB",city:"Mumbai",time:"19:30"},
{sr:21,date:"13 Apr",t1:"SRH",t2:"RR",city:"Hyderabad",time:"19:30"},
{sr:22,date:"14 Apr",t1:"CSK",t2:"KKR",city:"Chennai",time:"19:30"},
{sr:23,date:"15 Apr",t1:"RCB",t2:"LSG",city:"Bengaluru",time:"19:30"},
{sr:24,date:"16 Apr",t1:"MI",t2:"PBKS",city:"Mumbai",time:"19:30"},
{sr:25,date:"17 Apr",t1:"GT",t2:"KKR",city:"Ahmedabad",time:"19:30"},
{sr:26,date:"18 Apr",t1:"RCB",t2:"DC",city:"Bengaluru",time:"15:30"},
{sr:27,date:"18 Apr",t1:"SRH",t2:"CSK",city:"Hyderabad",time:"19:30"},
{sr:28,date:"19 Apr",t1:"KKR",t2:"RR",city:"Kolkata",time:"15:30"},
{sr:29,date:"19 Apr",t1:"PBKS",t2:"LSG",city:"New Chandigarh",time:"19:30"},
{sr:30,date:"20 Apr",t1:"GT",t2:"MI",city:"Ahmedabad",time:"19:30"},
{sr:31,date:"21 Apr",t1:"SRH",t2:"DC",city:"Hyderabad",time:"19:30"},
{sr:32,date:"22 Apr",t1:"LSG",t2:"RR",city:"Lucknow",time:"19:30"},
{sr:33,date:"23 Apr",t1:"MI",t2:"CSK",city:"Mumbai",time:"19:30"},
{sr:34,date:"24 Apr",t1:"RCB",t2:"GT",city:"Bengaluru",time:"19:30"},
{sr:35,date:"25 Apr",t1:"DC",t2:"PBKS",city:"Delhi",time:"15:30"},
{sr:36,date:"25 Apr",t1:"RR",t2:"SRH",city:"Jaipur",time:"19:30"},
{sr:37,date:"26 Apr",t1:"GT",t2:"CSK",city:"Ahmedabad",time:"15:30"},
{sr:38,date:"26 Apr",t1:"LSG",t2:"KKR",city:"Lucknow",time:"19:30"},
{sr:39,date:"27 Apr",t1:"DC",t2:"RCB",city:"Delhi",time:"19:30"},
{sr:40,date:"28 Apr",t1:"PBKS",t2:"RR",city:"New Chandigarh",time:"19:30"},
{sr:41,date:"29 Apr",t1:"MI",t2:"SRH",city:"Mumbai",time:"19:30"},
{sr:42,date:"30 Apr",t1:"GT",t2:"RCB",city:"Ahmedabad",time:"19:30"},
{sr:43,date:"01 May",t1:"RR",t2:"DC",city:"Jaipur",time:"19:30"},
{sr:44,date:"02 May",t1:"CSK",t2:"MI",city:"Chennai",time:"15:30"},
{sr:45,date:"03 May",t1:"SRH",t2:"KKR",city:"Hyderabad",time:"15:30"},
{sr:46,date:"03 May",t1:"GT",t2:"PBKS",city:"Ahmedabad",time:"19:30"},
{sr:47,date:"04 May",t1:"MI",t2:"LSG",city:"Mumbai",time:"19:30"},
{sr:48,date:"05 May",t1:"DC",t2:"CSK",city:"Delhi",time:"19:30"},
{sr:49,date:"06 May",t1:"SRH",t2:"PBKS",city:"Hyderabad",time:"19:30"},
{sr:50,date:"07 May",t1:"LSG",t2:"RCB",city:"Lucknow",time:"19:30"},
{sr:51,date:"08 May",t1:"DC",t2:"KKR",city:"Delhi",time:"19:30"},
{sr:52,date:"09 May",t1:"RR",t2:"GT",city:"Jaipur",time:"19:30"},
{sr:53,date:"10 May",t1:"CSK",t2:"LSG",city:"Chennai",time:"15:30"},
{sr:54,date:"10 May",t1:"RCB",t2:"MI",city:"Raipur",time:"19:30"},
{sr:55,date:"11 May",t1:"PBKS",t2:"DC",city:"Dharamshala",time:"19:30"},
{sr:56,date:"12 May",t1:"GT",t2:"SRH",city:"Ahmedabad",time:"19:30"},
{sr:57,date:"13 May",t1:"RCB",t2:"KKR",city:"Raipur",time:"19:30"},
{sr:58,date:"14 May",t1:"PBKS",t2:"MI",city:"Dharamshala",time:"19:30"},
{sr:59,date:"15 May",t1:"LSG",t2:"CSK",city:"Lucknow",time:"19:30"},
{sr:60,date:"16 May",t1:"KKR",t2:"GT",city:"Kolkata",time:"19:30"},
{sr:61,date:"17 May",t1:"PBKS",t2:"RCB",city:"Dharamshala",time:"15:30"},
{sr:62,date:"17 May",t1:"DC",t2:"RR",city:"Delhi",time:"19:30"},
{sr:63,date:"18 May",t1:"CSK",t2:"SRH",city:"Chennai",time:"19:30"},
{sr:64,date:"19 May",t1:"RR",t2:"LSG",city:"Jaipur",time:"19:30"},
{sr:65,date:"20 May",t1:"KKR",t2:"MI",city:"Kolkata",time:"19:30"},
{sr:66,date:"21 May",t1:"CSK",t2:"GT",city:"Chennai",time:"19:30"},
{sr:67,date:"22 May",t1:"SRH",t2:"RCB",city:"Hyderabad",time:"19:30"},
{sr:68,date:"23 May",t1:"LSG",t2:"PBKS",city:"Lucknow",time:"19:30"},
{sr:69,date:"24 May",t1:"MI",t2:"RR",city:"Mumbai",time:"15:30"},
{sr:70,date:"24 May",t1:"KKR",t2:"DC",city:"Kolkata",time:"19:30"}
];
var TRADE_WINDOWS=[10, 20, 30, 40, 50, 60];
var TEAM_CLR={CSK:'#F9CD05',MI:'#004BA0',RCB:'#EC1C24',KKR:'#3A225D',DC:'#004C93',PBKS:'#ED1B24',RR:'#EA1A85',SRH:'#FF822A',GT:'#1C1C2B',LSG:'#A72056'};
var TEAM_TXT={CSK:'#000',MI:'#fff',RCB:'#fff',KKR:'#fff',DC:'#fff',PBKS:'#fff',RR:'#fff',SRH:'#fff',GT:'#fff',LSG:'#fff'};

window.renderSchedule=function(){
 var el=document.getElementById('scheduleBody'); if(!el) return;
 var html=''; var prevDate=''; var tradeWindowSet=new Set(TRADE_WINDOWS);
 IPL_SCHEDULE.forEach(function(m,i){
  if(tradeWindowSet.has(i)){
   var _wIdx=TRADE_WINDOWS.indexOf(i)+1;
   var _prevMatch=IPL_SCHEDULE[i-1]; var _nextMatch=IPL_SCHEDULE[i];
   html+='<div class="sch-trade-window">'
    +'<div class="sch-trade-title">CHANGE &amp; TRADE WINDOW '+_wIdx+'</div>'
    +'<div class="sch-trade-sub">Between Match #'+(_prevMatch?_prevMatch.sr:'')+' ('+(_prevMatch?_prevMatch.date:'')+') and Match #'+(_nextMatch?_nextMatch.sr:'')+' ('+(_nextMatch?_nextMatch.date:'')+')</div>'
    +'<div class="sch-trade-note">Teams may trade players and adjust squads during this window</div></div>';
  }
  if(m.date!==prevDate){ html+='<div class="sch-date-hdr">'+m.date+' 2026</div>'; prevDate=m.date; }
  html+='<div class="sch-match">'
   +'<span class="sch-sr">#'+m.sr+'</span>'
   +'<span class="sch-team-badge team-bg-'+m.t1+'">'+m.t1+'</span>'
   +'<span class="sch-vs">vs</span>'
   +'<span class="sch-team-badge team-bg-'+m.t2+'">'+m.t2+'</span>'
   +'<span class="sch-city">'+m.city+'</span>'
   +'<span class="sch-time">'+m.time+' IST</span></div>';
 }); el.innerHTML=html;
};


// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// TRADING MODULE
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
var _tradeSendPlayers=[];
var _tradeReceivePlayers=[];

window.addTradePlayer=function(side){
 var selId = side==='send' ? 'tradeSendSelect' : 'tradeReceiveSelect';
 var listId = side==='send' ? 'tradeSendList' : 'tradeReceiveList';
 var arr = side==='send' ? _tradeSendPlayers : _tradeReceivePlayers;
 var sel = document.getElementById(selId);
 if(!sel||!sel.value) return;
 var name=sel.options[sel.selectedIndex].text;
 var val=sel.value;
 if(arr.some(function(p){return p.val===val;})) return window.showAlert('Player already added.');
 arr.push({val:val,name:name});
 window._renderTradeList(listId, arr, side);
 sel.selectedIndex=0;
};

window._renderTradeList=function(listId, arr, side){
 var el=document.getElementById(listId);
 if(!el) return;
 if(!arr.length){ el.innerHTML='<div style="font-size:.78rem;color:var(--dim);padding:4px;">No players selected</div>'; return; }
 el.innerHTML=arr.map(function(p,i){
  return '<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:var(--surface2);border-radius:6px;margin-bottom:4px;font-size:.82rem;">'
   +'<span style="flex:1;">'+p.name+'</span>'
   +'<button onclick="window._removeTradePlayer(\''+side+'\','+i+')" style="background:none;border:none;color:var(--err);cursor:pointer;font-size:.9rem;">x</button>'
   +'</div>';
 }).join('');
};

window._removeTradePlayer=function(side, idx){
 var arr = side==='send' ? _tradeSendPlayers : _tradeReceivePlayers;
 var listId = side==='send' ? 'tradeSendList' : 'tradeReceiveList';
 arr.splice(idx,1);
 window._renderTradeList(listId, arr, side);
};

window.clearTradeForm=function(){
 _tradeSendPlayers=[];
 _tradeReceivePlayers=[];
 window._renderTradeList('tradeSendList', [], 'send');
 window._renderTradeList('tradeReceiveList', [], 'receive');
 var s1=document.getElementById('tradeSendSelect'); if(s1) s1.selectedIndex=0;
 var s2=document.getElementById('tradeReceiveSelect'); if(s2) s2.selectedIndex=0;
 var s3=document.getElementById('tradePartnerSelect'); if(s3) s3.selectedIndex=0;
};

window.loadTradeDropdowns=function(){
 var state=draftState;
 if(!state||!state.teams) return;
 // Populate partner dropdown (all teams except mine)
 var partnerSel=document.getElementById('tradePartnerSelect');
 if(partnerSel){
  var html='<option value="">-- Select trade partner --</option>';
  Object.values(state.teams).forEach(function(t){
   if(t.name!==myTeamName) html+='<option value="'+t.name+'">'+t.name+'</option>';
  });
  partnerSel.innerHTML=html;
 }
 // Populate my players
 var sendSel=document.getElementById('tradeSendSelect');
 if(sendSel){
  var myTeam=state.teams[myTeamName];
  var roster=myTeam?(Array.isArray(myTeam.roster)?myTeam.roster:(myTeam.roster?Object.values(myTeam.roster):[])):[];
  var html2='<option value="">-- Select player to send --</option>';
  roster.forEach(function(p){
   var name=p.name||p.n||'';
   html2+='<option value="'+encodeURIComponent(name)+'">'+name+' ('+( p.iplTeam||p.t||'')+' | '+(p.role||p.r||'')+')</option>';
  });
  sendSel.innerHTML=html2;
 }
};

window.loadPartnerPlayers=function(){
 var state=draftState;
 var partnerName=document.getElementById('tradePartnerSelect')?.value;
 var recSel=document.getElementById('tradeReceiveSelect');
 if(!recSel||!partnerName||!state?.teams) return;
 var partner=state.teams[partnerName];
 var roster=partner?(Array.isArray(partner.roster)?partner.roster:(partner.roster?Object.values(partner.roster):[])):[];
 var html='<option value="">-- Select player to receive --</option>';
 roster.forEach(function(p){
  var name=p.name||p.n||'';
  html+='<option value="'+encodeURIComponent(name)+'">'+name+' ('+(p.iplTeam||p.t||'')+' | '+(p.role||p.r||'')+')</option>';
 });
 recSel.innerHTML=html;
};

window.proposeTrade=function(){
 if(!draftId||!myTeamName) return window.showAlert('Join a room first.');
 if(!_tradeSendPlayers.length) return window.showAlert('Select at least one player to send.');
 if(!_tradeReceivePlayers.length) return window.showAlert('Select at least one player to receive.');
 var partner=document.getElementById('tradePartnerSelect')?.value;
 if(!partner) return window.showAlert('Select a trade partner.');

 var trade={
  from:myTeamName,
  to:partner,
  sending:_tradeSendPlayers.map(function(p){return decodeURIComponent(p.val);}),
  receiving:_tradeReceivePlayers.map(function(p){return decodeURIComponent(p.val);}),
  status:'pending',
  proposedAt:Date.now(),
  proposedBy:(user&&user.uid)||''
 };

 push(ref(db,'drafts/'+draftId+'/trades'),trade).then(function(){
  window.showAlert('Trade proposed to '+partner+'! They need to accept.','ok');
  window.clearTradeForm();
 }).catch(function(e){ window.showAlert('Failed: '+e.message); });
};

window.acceptTrade=function(tradeId){
 if(!draftId) return;
 get(ref(db,'drafts/'+draftId)).then(function(snap){
  var data=snap.val();
  if(!data) return window.showAlert('Room data not found.');
  var trade=data.trades&&data.trades[tradeId];
  if(!trade||trade.status!=='pending') return window.showAlert('Trade no longer pending.');

  // Verify the accepting user owns the "to" team
  if(myTeamName!==trade.to) return window.showAlert('Only '+trade.to+' can accept this trade.');

  var fromTeam=data.teams[trade.from];
  var toTeam=data.teams[trade.to];
  if(!fromTeam||!toTeam) return window.showAlert('Team not found.');

  var fromRoster=Array.isArray(fromTeam.roster)?fromTeam.roster.slice():(fromTeam.roster?Object.values(fromTeam.roster):[]);
  var toRoster=Array.isArray(toTeam.roster)?toTeam.roster.slice():(toTeam.roster?Object.values(toTeam.roster):[]);

  // Move "sending" players: from -> to
  var sendingPlayers=[];
  trade.sending.forEach(function(name){
   var idx=fromRoster.findIndex(function(p){return(p.name||p.n||'')===name;});
   if(idx>=0){ sendingPlayers.push(fromRoster[idx]); fromRoster.splice(idx,1); }
  });

  // Move "receiving" players: to -> from
  var receivingPlayers=[];
  trade.receiving.forEach(function(name){
   var idx=toRoster.findIndex(function(p){return(p.name||p.n||'')===name;});
   if(idx>=0){ receivingPlayers.push(toRoster[idx]); toRoster.splice(idx,1); }
  });

  // Add to new teams
  sendingPlayers.forEach(function(p){ toRoster.push(p); });
  receivingPlayers.forEach(function(p){ fromRoster.push(p); });

  var upd={};
  upd['drafts/'+draftId+'/teams/'+trade.from+'/roster']=fromRoster;
  upd['drafts/'+draftId+'/teams/'+trade.to+'/roster']=toRoster;
  upd['drafts/'+draftId+'/trades/'+tradeId+'/status']='accepted';
  upd['drafts/'+draftId+'/trades/'+tradeId+'/completedAt']=Date.now();

  // Also update draftedBy/soldTo in the players array if it exists
  if(data.players){
   var allP=Array.isArray(data.players)?data.players:Object.values(data.players||{});
   trade.sending.forEach(function(name){
    var pIdx=allP.findIndex(function(p){return(p.name||p.n||'')===name;});
    if(pIdx>=0){
     upd['drafts/'+draftId+'/players/'+pIdx+'/draftedBy']=trade.to;
     upd['drafts/'+draftId+'/players/'+pIdx+'/soldTo']=trade.to;
    }
   });
   trade.receiving.forEach(function(name){
    var pIdx=allP.findIndex(function(p){return(p.name||p.n||'')===name;});
    if(pIdx>=0){
     upd['drafts/'+draftId+'/players/'+pIdx+'/draftedBy']=trade.from;
     upd['drafts/'+draftId+'/players/'+pIdx+'/soldTo']=trade.from;
    }
   });
  }

  // Invalidate squad caches for both teams
  upd['drafts/'+draftId+'/teams/'+trade.from+'/squadValid']=null;
  upd['drafts/'+draftId+'/teams/'+trade.to+'/squadValid']=null;

  update(ref(db),upd).then(function(){
   window.showAlert('Trade accepted! Rosters updated.','ok');
  }).catch(function(e){ window.showAlert('Trade failed: '+e.message); });
 });
};

window.rejectTrade=function(tradeId){
 if(!draftId) return;
 var upd={};
 upd['drafts/'+draftId+'/trades/'+tradeId+'/status']='rejected';
 upd['drafts/'+draftId+'/trades/'+tradeId+'/completedAt']=Date.now();
 update(ref(db),upd).then(function(){
  window.showAlert('Trade rejected.','ok');
 });
};

window.cancelTrade=function(tradeId){
 if(!draftId) return;
 var upd={};
 upd['drafts/'+draftId+'/trades/'+tradeId+'/status']='cancelled';
 update(ref(db),upd).then(function(){
  window.showAlert('Trade cancelled.','ok');
 });
};

window.renderTrades=function(data){
 if(!data) return;
 var trades=data.trades?Object.entries(data.trades):[];
 var pendingEl=document.getElementById('pendingTradesList');
 var historyEl=document.getElementById('tradeHistoryList');
 if(!pendingEl||!historyEl) return;

 var pending=trades.filter(function(e){return e[1].status==='pending';}).sort(function(a,b){return(b[1].proposedAt||0)-(a[1].proposedAt||0);});
 var history=trades.filter(function(e){return e[1].status!=='pending';}).sort(function(a,b){return(b[1].completedAt||b[1].proposedAt||0)-(a[1].completedAt||a[1].proposedAt||0);});

 if(!pending.length){ pendingEl.innerHTML='<div class="empty">No pending trades.</div>'; }
 else {
  pendingEl.innerHTML=pending.map(function(e){
   var tid=e[0], t=e[1];
   var isMine = t.from===myTeamName;
   var isForMe = t.to===myTeamName;
   var actions='';
   if(isForMe) actions='<button class="btn btn-sm" style="background:var(--ok-bg);color:var(--ok);border:1px solid var(--ok-border);" onclick="window.acceptTrade(\''+tid+'\')">Accept</button><button class="btn btn-ghost btn-sm" onclick="window.rejectTrade(\''+tid+'\')">Reject</button>';
   else if(isMine) actions='<button class="btn btn-ghost btn-sm" onclick="window.cancelTrade(\''+tid+'\')">Cancel</button>';
   else actions='<span style="font-size:.75rem;color:var(--dim);">Between other teams</span>';

   return '<div style="background:var(--surface);border:1px solid var(--b1);border-radius:var(--r);padding:12px;margin-bottom:8px;">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
    +'<span style="font-weight:600;font-size:.85rem;color:var(--txt);">'+t.from+' &#8596; '+t.to+'</span>'
    +'<span style="font-size:.72rem;color:var(--dim);">'+new Date(t.proposedAt).toLocaleDateString()+'</span></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'
    +'<div><div style="font-size:.72rem;color:var(--dim);margin-bottom:4px;">'+t.from+' sends:</div>'
    +t.sending.map(function(n){return '<div style="font-size:.82rem;font-weight:500;color:var(--err);">- '+n+'</div>';}).join('')+'</div>'
    +'<div><div style="font-size:.72rem;color:var(--dim);margin-bottom:4px;">'+t.to+' sends:</div>'
    +t.receiving.map(function(n){return '<div style="font-size:.82rem;font-weight:500;color:var(--ok);">- '+n+'</div>';}).join('')+'</div></div>'
    +'<div style="display:flex;gap:8px;">'+actions+'</div></div>';
  }).join('');
 }

 if(!history.length){ historyEl.innerHTML='<div class="empty">No completed trades yet.</div>'; }
 else {
  historyEl.innerHTML=history.slice(0,20).map(function(e){
   var t=e[1];
   var statusCol = t.status==='accepted'?'var(--ok)':t.status==='rejected'?'var(--err)':'var(--dim)';
   var statusLabel = t.status==='accepted'?'Completed':t.status==='rejected'?'Rejected':'Cancelled';
   return '<div style="background:var(--surface);border:1px solid var(--b0);border-radius:var(--r);padding:10px;margin-bottom:6px;opacity:'+(t.status==='accepted'?'1':'.6')+';">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;">'
    +'<span style="font-size:.82rem;font-weight:500;">'+t.from+' &#8596; '+t.to+'</span>'
    +'<span style="font-size:.72rem;font-weight:600;color:'+statusCol+';">'+statusLabel+'</span></div>'
    +'<div style="font-size:.75rem;color:var(--dim);margin-top:4px;">Sent: '+t.sending.join(', ')+' | Received: '+t.receiving.join(', ')+'</div></div>';
  }).join('');
 }
};

window.toggleSquadLock_D=function(){
 if(!isAdmin||!draftId) return;
 var currentLock=draftState&&draftState.squadLocked;
 var upd={}; upd['drafts/'+draftId+'/squadLocked']=!currentLock;
 update(ref(db),upd).then(function(){ window.showAlert(!currentLock?'My Team changes LOCKED.':'My Team changes UNLOCKED.','ok'); }).catch(function(e){ window.showAlert('Failed: '+e.message); });
};

// Super Admin: Toggle release/replace lock
window.toggleReleaseLock_D=function(){
 if(!isSuperAdminEmail(user?.email)||!draftId) return window.showAlert('Only the super admin can toggle the release lock.','error');
 var currentLock=draftState&&draftState.releaseLocked;
 var upd={}; upd['drafts/'+draftId+'/releaseLocked']=!currentLock;
 update(ref(db),upd).then(function(){ window.showAlert(!currentLock?'Player releases LOCKED. No one can release players.':'Player releases UNLOCKED.','ok'); }).catch(function(e){ window.showAlert('Failed: '+e.message); });
};

// ═══════════════════════════════════════════════════════════════
// COUNTER-UP ANIMATION
// ═══════════════════════════════════════════════════════════════
function counterUp(el, target, duration=700){
  if(!el) return;
  const from=parseFloat(el.textContent)||0;
  const start=performance.now();
  function tick(now){
    const p=Math.min((now-start)/duration,1);
    const ease=1-Math.pow(1-p,3);
    el.textContent=Math.round(from+(target-from)*ease);
    if(p<1) requestAnimationFrame(tick);
    else el.textContent=target;
  }
  requestAnimationFrame(tick);
  el.classList.remove('count-flash');
  void el.offsetWidth;
  el.classList.add('count-flash');
  setTimeout(()=>el.classList.remove('count-flash'),500);
}

// ═══════════════════════════════════════════════════════════════
// LIVE SCORE TICKER
// ═══════════════════════════════════════════════════════════════
let _liveCache=null, _liveTTL=0, _liveTimer=null;

async function fetchLiveScores(){
  const now=Date.now();
  if(_liveCache&&now<_liveTTL) return _liveCache;
  try{
    const sk='cbz_live_ts', sd='cbz_live_data';
    const ts=parseInt(sessionStorage.getItem(sk)||'0');
    if(ts>now){ _liveCache=JSON.parse(sessionStorage.getItem(sd)||'[]'); _liveTTL=ts; return _liveCache; }
    const res=await fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live',{
      headers:{'x-rapidapi-host':'cricbuzz-cricket.p.rapidapi.com','x-rapidapi-key':'6d53928bfdmsh545332aded830a3p11bdaajsncf079fc57095'}
    });
    if(!res.ok) return [];
    const data=await res.json();
    const iplMatches=[];
    (data.typeMatches||[]).forEach(tm=>{
      (tm.seriesMatches||[]).forEach(sm=>{
        const s=sm.seriesAdWrapper||sm;
        if(s.seriesId==9241||(s.seriesName||'').toLowerCase().includes('premier league')){
          (s.matches||[]).forEach(m=>iplMatches.push(m));
        }
      });
    });
    _liveCache=iplMatches; _liveTTL=now+60000;
    try{ sessionStorage.setItem(sk,String(_liveTTL)); sessionStorage.setItem(sd,JSON.stringify(iplMatches)); }catch{}
    return iplMatches;
  }catch{ return []; }
}

function renderLiveTicker(matches){
  const bar=document.getElementById('liveTickerBar');
  if(!bar) return;
  const dot=document.getElementById('navLiveDot');
  if(!matches||!matches.length){
    bar.innerHTML='<span class="ticker-no-live">No IPL matches live right now</span>';
    if(dot) dot.style.display='none';
    return;
  }
  if(dot) dot.style.display='inline-block';
  function fmtI(inn){ if(!inn) return ''; return `${inn.runs??'—'}/${inn.wickets??'—'} (${inn.overs??'—'})`; }
  const items=matches.map(m=>{
    const mi=m.matchInfo||{};
    const ms=m.matchScore||{};
    const t1=mi.team1?.teamSName||mi.team1?.teamName||'';
    const t2=mi.team2?.teamSName||mi.team2?.teamName||'';
    const t1s=fmtI(ms.team1Score?.inngs1)||fmtI(ms.team1Score?.inngs2)||'';
    const t2s=fmtI(ms.team2Score?.inngs1)||fmtI(ms.team2Score?.inngs2)||'';
    const state=mi.state||'';
    return `<span class="ticker-match"><span class="ticker-live-dot"></span><span class="ticker-team">${t1}</span> <span class="ticker-score">${t1s}</span> <span class="ticker-sep">vs</span> <span class="ticker-team">${t2}</span> <span class="ticker-score">${t2s}</span><span class="ticker-state"> ${state}</span></span>`;
  }).join('<span class="ticker-sep" style="padding:0 16px;opacity:.3;">|</span>');
  bar.innerHTML=`<div class="live-ticker-inner">${items}<span style="padding:0 32px;opacity:.3;">•</span>${items}</div>`;
}

async function startLiveTicker(){
  // Fetch once per app session — no auto-refresh to conserve API quota
  const matches=await fetchLiveScores();
  renderLiveTicker(matches);
}

// ═══════════════════════════════════════════════════════
// SIDEBAR NAVIGATION (DRAFT)
// ═══════════════════════════════════════════════════════
window.openSidebar=function(){
  const overlay=document.getElementById('sidebarOverlay');
  const sidebar=document.getElementById('sidebar');
  if(overlay) overlay.classList.add('open');
  if(sidebar) sidebar.classList.add('open');
  document.body.style.overflow='hidden';
  window.updateSidebarStats();
};
window.closeSidebar=function(){
  const overlay=document.getElementById('sidebarOverlay');
  const sidebar=document.getElementById('sidebar');
  if(overlay) overlay.classList.remove('open');
  if(sidebar) sidebar.classList.remove('open');
  document.body.style.overflow='';
};
window.setSidebarMode=function(mode){
  const dash=document.getElementById('sidebarDash');
  const room=document.getElementById('sidebarRoom');
  if(dash) dash.style.display=mode==='room'?'none':'block';
  if(room) room.style.display=mode==='room'?'block':'none';
};
window.updateSidebarStats=function(){
  const statsEl=document.getElementById('sidebarStats');
  const liveEl=document.getElementById('sidebarLivePill');
  const liveCount=document.getElementById('sidebarLiveCount');
  const roomLabel=document.getElementById('sidebarRoomLabel');
  if(!statsEl) return;
  if(draftState&&draftRoomId){
    const avail=draftState.players?Object.values(draftState.players).filter(p=>p.status==='available').length:0;
    statsEl.innerHTML=avail?`<div>${avail} players available</div>`:'';
    if(roomLabel) roomLabel.textContent=document.getElementById('roomTitleDisplay')?.textContent||'Draft Room';
  } else { statsEl.innerHTML=''; }
  if(liveEl&&liveCount&&draftState){
    const memberCount=draftState.members?Object.keys(draftState.members).length:0;
    if(memberCount>0){ liveEl.style.display='inline-flex'; liveCount.textContent=`${memberCount} live`; }
    else liveEl.style.display='none';
  } else if(liveEl) liveEl.style.display='none';
};
window.scrollToDashSection=function(section){
  const el=document.getElementById(`tab-${section}`);
  if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
};
document.addEventListener('keydown',function(e){
  if(e.key==='Escape') window.closeSidebar();
});

// DRAFT PICK FLASH ANIMATION
window.showDraftPickFlash=function(playerName, teamName){
  const el=document.getElementById('soldFlash');
  const teamEl=document.getElementById('soldFlashTeam');
  const priceEl=document.getElementById('soldFlashPrice');
  const labelEl=el?.querySelector('.sold-flash-label');
  if(!el) return;
  const IPL_COLORS={CSK:'#FAED24',MI:'#00528A',KKR:'#602F92',RCB:'#D5282D',PBKS:'#D52027',GT:'#1B2A4A',RR:'#ED1164',SRH:'#F04F23',LSG:'#AB1D3F',DC:'#243D88'};
  let bg='#602F92';
  if(teamName) Object.entries(IPL_COLORS).forEach(([k,v])=>{ if(teamName.toUpperCase().includes(k)) bg=v; });
  el.style.background=bg;
  if(labelEl) labelEl.textContent='PICKED';
  if(teamEl) teamEl.textContent=playerName||'';
  if(priceEl) priceEl.textContent=teamName||'';
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),2600);
};

// THEME TOGGLE PATCH
(function patchThemeToggle(){
  const orig=window.toggleDark;
  window.toggleDark=function(){
    orig&&orig();
    const isLight=document.body.classList.contains('light');
    const moon=document.querySelector('.theme-toggle .icon-moon');
    const sun=document.querySelector('.theme-toggle .icon-sun');
    if(moon) moon.style.display=isLight?'none':'block';
    if(sun) sun.style.display=isLight?'block':'none';
  };
  document.addEventListener('DOMContentLoaded',function(){
    const isLight=document.body.classList.contains('light');
    const moon=document.querySelector('.theme-toggle .icon-moon');
    const sun=document.querySelector('.theme-toggle .icon-sun');
    if(moon) moon.style.display=isLight?'none':'block';
    if(sun) sun.style.display=isLight?'block':'none';
    window.setSidebarMode('dash');
  });
})();

// ─────────────────────────────────────────────────────────
// Bridge: expose module-scoped state + helpers to window
// for the new CD UI layer (cd-app.js). No classic behavior
// is modified — these are additive window mirrors.
// ─────────────────────────────────────────────────────────
window.cbzAvatar = cbzAvatar;
window.cbzGetImg = cbzGetImg;
window.cbzPlayerImgId = cbzPlayerImgId;
window.IPL_TEAM_META = typeof IPL_TEAM_META !== 'undefined' ? IPL_TEAM_META : {};
window.IPL_SCHEDULE = typeof IPL_SCHEDULE !== 'undefined' ? IPL_SCHEDULE : [];

// CD expects `window.roomState` and `window.roomId` to be current; mirror
// on every assignment in classic by wrapping the onAuthStateChanged + listener
// flow. Easiest pragmatic approach: a ticker that polls module state.
(function mirrorDraftState(){
  function sync(){
    window.user = user || window.user || null;
    window.roomId = draftId || null;
    window.roomState = draftState || null;
    window.myTeamName = myTeamName || '';
    window.isAdmin = !!isAdmin;
  }
  setInterval(sync, 120);
  sync();
})();

// Room lists for the CD dashboard. The CD layer listens for a
// 'cd-drafts-update' CustomEvent to know when to re-render.
(function publishRoomsForCD(){
  if(!auth) return;
  let unsubCreated = null, unsubJoined = null;
  const push = () => { try { window.dispatchEvent(new CustomEvent('cd-drafts-update')); } catch(e){} };
  onAuthStateChanged(auth, u => {
    try { unsubCreated && unsubCreated(); } catch(e){}
    try { unsubJoined && unsubJoined(); } catch(e){}
    window.userCreatedDrafts = [];
    window.userJoinedDrafts = [];
    if(!u){ push(); return; }
    unsubCreated = onValue(ref(db, `users/${u.uid}/drafts`), snap => {
      const val = snap.val() || {};
      window.userCreatedDrafts = Object.entries(val).map(([rid, r]) => ({
        id: rid, type: 'draft', isOwner: true,
        roomName: r.name || r.roomName || '',
        name: r.name || r.roomName || '',
        maxTeams: r.maxTeams, picksPerTeam: r.picksPerTeam,
        createdAt: r.createdAt || 0
      }));
      push();
    });
    unsubJoined = onValue(ref(db, `users/${u.uid}/joinedDrafts`), snap => {
      const val = snap.val() || {};
      window.userJoinedDrafts = Object.entries(val).map(([rid, r]) => ({
        id: rid, type: 'draft', isOwner: false,
        roomName: r.name || r.roomName || '',
        name: r.name || r.roomName || '',
        teamName: r.teamName, maxTeams: r.maxTeams, picksPerTeam: r.picksPerTeam,
        joinedAt: r.joinedAt || 0
      }));
      push();
    });
  });
})();

// Squad save used by CD My Team edit mode. Validates XI/Bench
// composition and writes to the same draft paths the classic
// mt_save_D handler uses, so no data migration is needed.
window.saveSquadCD = async function(xiNames, benchNames){
  if(!user || !user.uid) return { ok:false, error:'Not signed in' };
  if(!draftId) return { ok:false, error:'No active draft' };
  if(!myTeamName) return { ok:false, error:'No team registered' };
  if(draftState && draftState.squadLocked && !isAdmin){
    return { ok:false, error:'Squad changes are locked by admin' };
  }
  const team = draftState?.teams?.[myTeamName];
  if(!team) return { ok:false, error:'Team not found' };
  const roster = Array.isArray(team.roster) ? team.roster : (team.roster ? Object.values(team.roster) : []);
  const allNames = roster.map(p => p.name || p.n || '');
  const bad = xiNames.concat(benchNames).filter(n => allNames.indexOf(n) < 0);
  if(bad.length) return { ok:false, error:'Unknown player: ' + bad[0] };
  const combined = xiNames.concat(benchNames);
  if(new Set(combined).size !== combined.length){
    return { ok:false, error:'A player appears twice in XI/Bench' };
  }
  const xiTarget = Math.min(11, roster.length);
  const needBench = roster.length > 11;
  const benchTarget = needBench ? Math.min(5, roster.length - 11) : 0;
  const msgs = [];
  if(xiNames.length !== xiTarget) msgs.push('XI needs ' + xiTarget + ' (has ' + xiNames.length + ')');
  if(needBench && benchNames.length !== benchTarget) msgs.push('Bench needs ' + benchTarget + ' (has ' + benchNames.length + ')');
  function _pd(n){ return roster.find(x => (x.name||x.n||'') === n) || {}; }
  function _pr(n){ return (_pd(n).role || _pd(n).r || '').toLowerCase(); }
  function _po(n){ return !!(_pd(n).isOverseas || _pd(n).o); }
  function _cb(n){ const r = _pr(n); return r.indexOf('bowler') >= 0 || r.indexOf('all-rounder') >= 0 || r.indexOf('all rounder') >= 0; }
  function _wk(n){ const r = _pr(n); return r.indexOf('wicketkeeper') >= 0 || r.indexOf('keeper') >= 0; }
  const xiOs = xiNames.filter(_po).length;
  const benchOs = benchNames.filter(_po).length;
  const xiBowl = xiNames.filter(_cb).length;
  const xiWk = xiNames.filter(_wk).length;
  const p16Os = xiOs + benchOs;
  if(p16Os > 6) msgs.push('Playing 16 has ' + p16Os + ' overseas (max 6)');
  if(xiNames.length === xiTarget && xiTarget >= 5 && xiBowl < 5) msgs.push('XI needs 5+ bowlers/all-rounders (has ' + xiBowl + ')');
  if(xiNames.length === xiTarget && xiWk < 1) msgs.push('XI needs at least 1 wicketkeeper (has ' + xiWk + ')');
  if(msgs.length) return { ok:false, error: msgs.join(' · ') };
  try{
    await set(ref(db, 'users/' + user.uid + '/squads/drafts/' + draftId), { xi: xiNames, bench: benchNames, savedAt: Date.now() });
    await update(ref(db, 'drafts/' + draftId + '/teams/' + myTeamName), { squadValid: true, activeSquad: xiNames.concat(benchNames) });
    return { ok:true };
  }catch(e){ return { ok:false, error: e.message || String(e) }; }
};

window.validateSquadCD = function(xiNames, benchNames){
  const team = draftState?.teams?.[myTeamName];
  if(!team) return { ok:false, errors:['No team registered'] };
  const roster = Array.isArray(team.roster) ? team.roster : (team.roster ? Object.values(team.roster) : []);
  const xiTarget = Math.min(11, roster.length);
  const needBench = roster.length > 11;
  const benchTarget = needBench ? Math.min(5, roster.length - 11) : 0;
  const errs = [];
  function _pd(n){ return roster.find(x => (x.name||x.n||'') === n) || {}; }
  function _pr(n){ return (_pd(n).role || _pd(n).r || '').toLowerCase(); }
  function _po(n){ return !!(_pd(n).isOverseas || _pd(n).o); }
  function _cb(n){ const r = _pr(n); return r.indexOf('bowler') >= 0 || r.indexOf('all-rounder') >= 0 || r.indexOf('all rounder') >= 0; }
  function _wk(n){ const r = _pr(n); return r.indexOf('wicketkeeper') >= 0 || r.indexOf('keeper') >= 0; }
  if(xiNames.length !== xiTarget) errs.push('XI needs ' + xiTarget + ' (has ' + xiNames.length + ')');
  if(needBench && benchNames.length !== benchTarget) errs.push('Bench needs ' + benchTarget + ' (has ' + benchNames.length + ')');
  const xiOs = xiNames.filter(_po).length;
  const benchOs = benchNames.filter(_po).length;
  const xiBowl = xiNames.filter(_cb).length;
  const xiWk = xiNames.filter(_wk).length;
  const p16Os = xiOs + benchOs;
  if(p16Os > 6) errs.push('Playing 16 has ' + p16Os + ' overseas (max 6)');
  if(xiNames.length === xiTarget && xiTarget >= 5 && xiBowl < 5) errs.push('XI needs 5+ bowlers/all-rounders (has ' + xiBowl + ')');
  if(xiNames.length === xiTarget && xiWk < 1) errs.push('XI needs at least 1 wicketkeeper (has ' + xiWk + ')');
  return { ok: errs.length === 0, errors: errs };
};

// Small adapters so the CD layer can call auction-style names without edits
window.showPlayerModal = window.showPlayerModal || function(name){
  if(typeof window.showPlayerModalDraft === 'function') return window.showPlayerModalDraft(name);
};


// ─── CD Super Admin Console bridge ──────────────────────────────
// Expose module-scope helpers + unify handler names with the auction app
// so the shared CD admin console (cd-app.js) works unchanged.
window.renderSuperAdminPanel       = renderSuperAdminPanel;
window.renderGlobalScorecardHistory = renderGlobalScorecardHistory;
window.refreshGlobalScorecardList  = renderGlobalScorecardHistory;
window.populateScorecardSelect     = renderSuperAdminPanel;

// Cricbuzz naming parity (draft uses cbzD* prefix internally)
window.cbzFetchLive      = window.cbzFetchLive      || window.cbzDFetchLive;
window.cbzFetchRecent    = window.cbzFetchRecent    || window.cbzDFetchRecent;
window.cbzFetchUpcoming  = window.cbzFetchUpcoming  || window.cbzDFetchUpcoming;
window.cbzFetchScorecard = window.cbzFetchScorecard || window.cbzDFetchScorecard;
window.cbzPushToRoom     = window.cbzPushToRoom     || window.cbzDPushToForm;

// XI multiplier casing parity
window.saSetXIMultiplier = window.saSetXIMultiplier || window.saSetXiMultiplier;
