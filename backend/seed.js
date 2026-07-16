require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Department = require('./models/Department');
const Doctor = require('./models/Doctor');
const Receptionist = require('./models/Receptionist');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Queue = require('./models/Queue');
const Notification = require('./models/Notification');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_queue';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected. Clearing existing data...');

    await Promise.all([
      User.deleteMany({}),
      Hospital.deleteMany({}),
      Department.deleteMany({}),
      Doctor.deleteMany({}),
      Receptionist.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({}),
      Queue.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // ── Hospital ──────────────────────────────────────────────
    const hosp = await Hospital.create({
      name: 'City General Medical Center',
      address: '742 Evergreen Terrace, Medical Zone, Mumbai - 400001',
      phone: '1112223333',
    });

    // ── Departments ───────────────────────────────────────────
    const [cardiology, pediatrics, neurology, dermatology] = await Department.insertMany([
      { name: 'Cardiology',   hospital: hosp._id, description: 'Heart and vascular care' },
      { name: 'Pediatrics',   hospital: hosp._id, description: 'Child and infant care' },
      { name: 'Neurology',    hospital: hosp._id, description: 'Brain and nervous system' },
      { name: 'Dermatology',  hospital: hosp._id, description: 'Skin, hair and nail care' },
    ]);

    // ── Admin ─────────────────────────────────────────────────
    await User.create({ name: 'Global Administrator', email: 'admin@hospital.com', password: 'adminpassword123', role: 'Admin', phone: '9999999999' });

    // ── Receptionist (only Suresh) ────────────────────────────
    const sureshUser = await User.create({ name: 'Suresh Pillai', email: 'suresh@hospital.com', password: 'receppassword123', role: 'Receptionist', phone: '8887776662' });
    await Receptionist.create({ user: sureshUser._id, hospital: hosp._id });

    // ── Doctors (4) ───────────────────────────────────────────
    const doctorData = [
      { name: 'Dr. Khushi Singh',  email: 'khushi@hospital.com',    phone: '4441110001', dept: cardiology,  spec: 'Interventional Cardiology', avg: 10 },
      { name: 'Dr. Rahul Desai',   email: 'rahul@hospital.com',     phone: '4441110002', dept: pediatrics,  spec: 'General Pediatrics',        avg: 15 },
      { name: 'Dr. Siddharth Rao', email: 'siddharth@hospital.com', phone: '4441110005', dept: neurology,   spec: 'Clinical Neurology',        avg: 20 },
      { name: 'Dr. Meera Kapoor',  email: 'meera@hospital.com',     phone: '4441110006', dept: dermatology, spec: 'Cosmetic Dermatology',      avg: 10 },
    ];
    const docs = [];
    for (const d of doctorData) {
      const u = await User.create({ name: d.name, email: d.email, password: 'doctorpassword123', role: 'Doctor', phone: d.phone });
      const doc = await Doctor.create({ user: u._id, hospital: hosp._id, department: d.dept._id, specialization: d.spec, avgConsultationTimeMinutes: d.avg });
      docs.push({ doc, dept: d.dept });
    }

    // ── Patients (20) ─────────────────────────────────────────
    const patientData = [
      { name: 'Sanjana Bhandari', email: 'sanjana@patient.com',  phone: '7770000001', gender: 'Female', age: 20, bloodGroup: 'O+' },
      { name: 'Rohan Verma',      email: 'rohan@patient.com',    phone: '7770000002', gender: 'Male',   age: 35, bloodGroup: 'A+' },
      { name: 'Priya Sharma',     email: 'priya@patient.com',    phone: '7770000003', gender: 'Female', age: 28, bloodGroup: 'B+' },
      { name: 'Arjun Mehta',      email: 'arjun@patient.com',    phone: '7770000004', gender: 'Male',   age: 45, bloodGroup: 'AB+' },
      { name: 'Neha Patel',       email: 'neha@patient.com',     phone: '7770000005', gender: 'Female', age: 32, bloodGroup: 'O-' },
      { name: 'Vikram Singh',     email: 'vikram@patient.com',   phone: '7770000006', gender: 'Male',   age: 52, bloodGroup: 'B-' },
      { name: 'Ananya Roy',       email: 'ananya@patient.com',   phone: '7770000007', gender: 'Female', age: 24, bloodGroup: 'A-' },
      { name: 'Karan Joshi',      email: 'karan@patient.com',    phone: '7770000008', gender: 'Male',   age: 40, bloodGroup: 'O+' },
      { name: 'Deepika Nair',     email: 'deepika@patient.com',  phone: '7770000009', gender: 'Female', age: 29, bloodGroup: 'B+' },
      { name: 'Manish Tiwari',    email: 'manish@patient.com',   phone: '7770000010', gender: 'Male',   age: 38, bloodGroup: 'A+' },
      { name: 'Kavya Reddy',      email: 'kavya@patient.com',    phone: '7770000011', gender: 'Female', age: 22, bloodGroup: 'AB-' },
      { name: 'Sunil Yadav',      email: 'sunil@patient.com',    phone: '7770000012', gender: 'Male',   age: 60, bloodGroup: 'O+' },
      { name: 'Ritu Agarwal',     email: 'ritu@patient.com',     phone: '7770000013', gender: 'Female', age: 44, bloodGroup: 'A+' },
      { name: 'Nikhil Bose',      email: 'nikhil@patient.com',   phone: '7770000014', gender: 'Male',   age: 31, bloodGroup: 'B+' },
      { name: 'Shreya Pillai',    email: 'shreya@patient.com',   phone: '7770000015', gender: 'Female', age: 26, bloodGroup: 'O-' },
      { name: 'Aditya Kumar',     email: 'aditya@patient.com',   phone: '7770000016', gender: 'Male',   age: 48, bloodGroup: 'AB+' },
      { name: 'Pooja Mishra',     email: 'poojam@patient.com',   phone: '7770000017', gender: 'Female', age: 33, bloodGroup: 'B-' },
      { name: 'Rahul Gupta',      email: 'rahulg@patient.com',   phone: '7770000018', gender: 'Male',   age: 27, bloodGroup: 'A-' },
      { name: 'Sneha Iyer',       email: 'sneha@patient.com',    phone: '7770000019', gender: 'Female', age: 36, bloodGroup: 'O+' },
      { name: 'Tarun Malhotra',   email: 'tarun@patient.com',    phone: '7770000020', gender: 'Male',   age: 55, bloodGroup: 'A+' },
    ];
    const patients = [];
    for (const p of patientData) {
      const u = await User.create({ name: p.name, email: p.email, password: 'patientpassword123', role: 'Patient', phone: p.phone });
      const pat = await Patient.create({ user: u._id, gender: p.gender, age: p.age, bloodGroup: p.bloodGroup });
      patients.push({ user: u, patient: pat });
    }

    // ── Helper ────────────────────────────────────────────────
    async function buildQueue(docObj, date, appointmentList) {
      const queue = await Queue.create({ doctor: docObj.doc._id, date, appointments: [] });
      for (let i = 0; i < appointmentList.length; i++) {
        const { patient, status, isEmergency, symptoms, diagnosis } = appointmentList[i];
        const apt = await Appointment.create({
          patient: patient._id,
          doctor: docObj.doc._id,
          hospital: hosp._id,
          department: docObj.dept._id,
          date,
          tokenNumber: i + 1,
          status,
          isEmergency: isEmergency || false,
          symptoms: symptoms || '',
          diagnosis: diagnosis || '',
        });
        queue.appointments.push(apt._id);
      }
      await queue.save();
    }

    // ── TODAY ─────────────────────────────────────────────────
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);

    await buildQueue(docs[0], today, [ // Dr. Khushi Singh — Cardiology
      { patient: patients[0].patient,  status: 'Completed', symptoms: 'Chest pain and shortness of breath', diagnosis: 'Mild angina. Prescribed nitrates and rest.' },
      { patient: patients[1].patient,  status: 'Completed', symptoms: 'Irregular heartbeat',               diagnosis: 'Atrial fibrillation. Referred for ECG.' },
      { patient: patients[2].patient,  status: 'Serving',   symptoms: 'High blood pressure follow-up' },
      { patient: patients[3].patient,  status: 'Scheduled', symptoms: 'Palpitations and dizziness', isEmergency: true },
      { patient: patients[4].patient,  status: 'Scheduled', symptoms: 'Routine cardiac checkup' },
      { patient: patients[5].patient,  status: 'Scheduled', symptoms: 'Post-surgery follow-up' },
      { patient: patients[6].patient,  status: 'Scheduled', symptoms: 'Chest tightness on exertion' },
    ]);

    await buildQueue(docs[1], today, [ // Dr. Rahul Desai — Pediatrics
      { patient: patients[7].patient,  status: 'Completed', symptoms: 'Fever and cold',      diagnosis: 'Viral fever. Paracetamol prescribed.' },
      { patient: patients[8].patient,  status: 'Completed', symptoms: 'Vaccination visit',   diagnosis: 'MMR vaccine administered.' },
      { patient: patients[9].patient,  status: 'Completed', symptoms: 'Stomach ache',        diagnosis: 'Gastritis. ORS and antacids.' },
      { patient: patients[10].patient, status: 'Serving',   symptoms: 'Skin rash on arms' },
      { patient: patients[11].patient, status: 'Scheduled', symptoms: 'Growth checkup' },
      { patient: patients[12].patient, status: 'Scheduled', symptoms: 'Recurring cough' },
    ]);

    await buildQueue(docs[2], today, [ // Dr. Siddharth Rao — Neurology
      { patient: patients[13].patient, status: 'Completed', symptoms: 'Severe migraines',        diagnosis: 'Chronic migraine. Sumatriptan prescribed.' },
      { patient: patients[14].patient, status: 'Serving',   symptoms: 'Memory loss episodes' },
      { patient: patients[15].patient, status: 'Scheduled', symptoms: 'Numbness in hands' },
      { patient: patients[16].patient, status: 'Scheduled', symptoms: 'Seizure history follow-up' },
      { patient: patients[17].patient, status: 'Scheduled', symptoms: 'Dizziness and vertigo' },
    ]);

    await buildQueue(docs[3], today, [ // Dr. Meera Kapoor — Dermatology
      { patient: patients[18].patient, status: 'Completed', symptoms: 'Acne breakout',   diagnosis: 'Hormonal acne. Topical retinoid prescribed.' },
      { patient: patients[19].patient, status: 'Completed', symptoms: 'Eczema flare-up', diagnosis: 'Atopic dermatitis. Steroid cream advised.' },
      { patient: patients[0].patient,  status: 'Serving',   symptoms: 'Psoriasis patches' },
      { patient: patients[1].patient,  status: 'Scheduled', symptoms: 'Hair loss' },
      { patient: patients[2].patient,  status: 'Scheduled', symptoms: 'Fungal infection on feet' },
      { patient: patients[3].patient,  status: 'Scheduled', symptoms: 'Mole checkup' },
    ]);

    // ── THIS WEEK (tomorrow to +5 days) ───────────────────────
    console.log('Creating this week\'s appointments...');
    const weekSymptoms = [
      'Chest pain follow-up', 'Blood pressure check', 'Post-surgery review',
      'Fever and body ache', 'Skin allergy', 'Headache',
      'Diabetes management', 'Routine checkup', 'Vaccination', 'Dizziness',
    ];
    for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + dayOffset);
      futureDate.setUTCHours(0, 0, 0, 0);
      for (let di = 0; di < docs.length; di++) {
        const count = 3 + (dayOffset % 3);
        const apptList = [];
        for (let k = 0; k < count; k++) {
          const patIdx = (di * 3 + dayOffset + k) % patients.length;
          apptList.push({
            patient: patients[patIdx].patient,
            status: 'Scheduled',
            symptoms: weekSymptoms[(di + dayOffset + k) % weekSymptoms.length],
          });
        }
        await buildQueue(docs[di], futureDate, apptList);
      }
    }

    // ── PAST HISTORY (last 30 days) ───────────────────────────
    console.log('Creating past appointment history...');
    const pastSD = [
      { s: 'Chest pain',         d: 'Stable angina. Aspirin and beta-blockers prescribed.' },
      { s: 'Flu symptoms',       d: 'Influenza A. Rest, fluids, oseltamivir.' },
      { s: 'Skin rash',          d: 'Contact dermatitis. Antihistamines.' },
      { s: 'Migraine',           d: 'Migraine without aura. Ibuprofen and dark room rest.' },
      { s: 'Stomach pain',       d: 'Peptic ulcer. PPI therapy started.' },
      { s: 'Fever',              d: 'Viral fever. Paracetamol and rest.' },
      { s: 'Cough and cold',     d: 'Upper respiratory infection. Antihistamines.' },
      { s: 'Diabetes follow-up', d: 'HbA1c 7.2. Metformin dose adjusted.' },
    ];
    for (let daysAgo = 1; daysAgo <= 30; daysAgo++) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - daysAgo);
      pastDate.setUTCHours(0, 0, 0, 0);
      const count = daysAgo % 3 === 0 ? 3 : 2;
      for (let k = 0; k < count; k++) {
        const docObj = docs[(daysAgo + k) % docs.length];
        const pat = patients[(daysAgo * 2 + k) % patients.length];
        const sd = pastSD[(daysAgo + k) % pastSD.length];
        await Appointment.create({
          patient: pat.patient._id,
          doctor: docObj.doc._id,
          hospital: hosp._id,
          department: docObj.dept._id,
          date: pastDate,
          tokenNumber: k + 1,
          status: daysAgo % 7 === 0 ? 'Cancelled' : 'Completed',
          symptoms: sd.s,
          diagnosis: daysAgo % 7 === 0 ? '' : sd.d,
        });
      }
    }

    // ── Notifications for Sanjana ─────────────────────────────
    console.log('Creating notifications...');
    const sanjana = patients[0];
    await Notification.insertMany([
      { user: sanjana.user._id, title: 'Your turn is next!',     message: 'Please proceed to Dr. Khushi Singh\'s room. Your token is #3.' },
      { user: sanjana.user._id, title: 'Appointment Reminder',   message: 'You have an appointment with Dr. Meera Kapoor today. Token #3.' },
      { user: sanjana.user._id, title: 'Appointment Completed',  message: 'Your visit with Dr. Khushi Singh is marked complete. Get well soon!' },
      { user: sanjana.user._id, title: 'New Appointment Booked', message: 'Walk-in appointment booked for Dermatology. Token #3.' },
      { user: sanjana.user._id, title: '2 Patients Ahead',       message: 'You are 2 patients away from your turn with Dr. Siddharth Rao.' },
    ]);

    console.log('\n✅ Seed complete!\n');
    console.log('  Admin:               admin@hospital.com      / adminpassword123');
    console.log('  Receptionist:        suresh@hospital.com     / receppassword123');
    console.log('  Doctor (Cardiology): khushi@hospital.com     / doctorpassword123');
    console.log('  Doctor (Pediatrics): rahul@hospital.com      / doctorpassword123');
    console.log('  Doctor (Neurology):  siddharth@hospital.com  / doctorpassword123');
    console.log('  Doctor (Dermatology):meera@hospital.com      / doctorpassword123');
    console.log('  Patient (Sanjana):   sanjana@patient.com     / patientpassword123');
    console.log('  (+ 19 more patients @patient.com / patientpassword123)');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedData();
