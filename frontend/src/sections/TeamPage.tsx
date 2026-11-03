import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Award,
  GraduationCap,
  Sparkles,
  Mail,
  Linkedin,
  Github,
  Edit3,
  CheckCircle2,
  Cpu,
  Layers,
  Code2,
  CircuitBoard,
  BookOpen,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  enrollmentNo: string;
  branch: string;
  institution: string;
  email: string;
  photoUrl: string;
  responsibilities: string[];
  skills: string[];
  linkedin?: string;
  github?: string;
}

interface Mentor {
  id: string;
  name: string;
  designation: string;
  department: string;
  institution: string;
  email: string;
  photoUrl: string;
  specialization: string;
  mentorshipArea: string;
  guidanceHighlights: string[];
}

export const TeamPage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);

  // Default Student Team Details (3 Members: Himesh + 2 Team Members)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "member-1",
      name: "Gune Jain",
      role: "Hardware Conditioning & Standards Assessment Engineer",
      enrollmentNo: "BTEO24O1016",
      branch: "B.Tech - IoT ENgineering (3rd Year)",
      institution: "Department of IoT Engineering",
      email: "24eo10gu7@mitsgwl.ac.in",
      photoUrl: "images/gune.jpeg",
      responsibilities: [
        "Hardware Circuit Design & Sensor Signal Conditioning",
        "Galvanic Isolation & Current Transformer (CT) Safety",
        "ISO 10816-1 & IEC 60034-1 Deterministic Assessment Rules",
        "Data Hygiene & Operational Validation Testing",
      ],
      skills: ["Circuit Schematic", "Signal Conditioning", "Power Safety", "Sensor Calibration", "ISO Standards"],
      linkedin: "https://www.linkedin.com/in/gune-jain",
      github: "https://github.com/Gauri1224",
    },
    {
      id: "member-2",
      name: "Himesh Badlani",
      role: "Full-Stack & ML Developer",
      
      enrollmentNo: "BTEO24O1019",
      branch: "B.Tech - IoT Engineering (3rd Year)",
      institution: "Department of IoT Engineering",
      email: "24eo10hi10@mitsgwl.ac.in",
      photoUrl: "/images/himesh.png",
      responsibilities: [
        "System Architecture & Pipeline Integration",
        "React Dashboard & Animated Recharts Frontend",
        "Node.js Backend & Real-Time Socket.IO Telemetry",
        "Isolation Forest ML Feature Compatibility Layer",
      ],
      skills: ["React / Vite", "TypeScript", "Python / FastAPI", "Node.js", "Scikit-Learn"],
      
      linkedin: "https://www.linkedin.com/in/himesh-badlani-03778b322/",
      github: "https://github.com/himesh-17",
    },
    {
      id: "member-3",
      name: "Manas Kukreja",
      role: "Embedded Systems & Firmware Engineer",
      enrollmentNo: "BTEO24O1030",
      branch: "B.Tech - IoT Engineering (3rd Year)",
      institution: "Department of IoT Engineering",
      email: "24eo10ma20@mitsgwl.ac.in",
      photoUrl: "images/manas.jpeg",
      responsibilities: [
        "ESP32 Microcontroller Firmware Development",
        "1 kHz ADC Sampling & Circular Buffering",
        "On-Device True RMS Digital Signal Processing",
        "Sensor Interfacing (MPU-6500 I2C & DS18B20 1-Wire)",
      ],
      skills: ["Embedded C++", "ESP32 DevKit", "I2C / 1-Wire", "FreeRTOS", "DSP Basics"],
    
      linkedin: "https://www.linkedin.com/in/manaskukreja29",
      github: "https://github.com/Manas-codezz",
    },
  ]);

  // Project Faculty & Technical Mentors
  const [mentors, setMentors] = useState<Mentor[]>([
    {
      id: "mentor-1",
      name: "Dr. Aftab Ahmed Ansari",
      designation: "Assistant Professor",
      department: "Center of Internet of Things",
      institution: "Madhav Institue of Technology & Science Gwalior",
      email: "aftabansari@mitsgwalior.in",
      photoUrl: "/images/Mentor1.jpeg",
      specialization: "Model Predictive Control, Grid Connected Systems, IoT",
      mentorshipArea: "Project Guidance, Edge Architecture & Industrial Standards Alignment",
      guidanceHighlights: [
        "Architectural supervision for decoupled IoT telemetry streaming",
        "Guidance on electrical safety and galvanic isolation for motor testing",
        "Standards alignment with IEC 60034-1 and ISO vibration severity standards",
      ],
    },
    {
      id: "mentor-2",
      name: "Dr. Rupam Srivastava",
      designation: "Assistant Professor",
      department: "Department of AI & Data Science",
      institution: "Madhav Institue of Technology & Science Gwalior",
      email: "rupamsrivastava@mitsgwalior.in",
      photoUrl: "/images/Mentor2.jpg",
      specialization: "SPR-based Optical Sensors",
      mentorshipArea: "Machine Learning Formulation, Zero-Leakage Validation & Error Diagnosis",
      guidanceHighlights: [
        "Mentorship on unsupervised anomaly detection using Isolation Forest",
        "Critical oversight on preventing temporal data leakage in time-series splits",
        "Root-cause diagnosis of operating-mode domain shift between benchmark experiments",
      ],
    },
  ]);

  const handleMemberChange = (id: string, field: keyof TeamMember, val: any) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  const handleMentorChange = (id: string, field: keyof Mentor, val: any) => {
    setMentors((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  return (
    <div className="space-y-10 animate-fadeIn text-[#F1F5F9] pb-10">
      {/* 1. Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl border border-[#1E293B] bg-gradient-to-br from-[#111B2E] via-[#0B1220] to-[#172338] p-6 sm:p-8 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-[#22D3EE]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-[#A855F7]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#22D3EE]/15 border border-[#22D3EE]/30 px-3 py-1 text-xs font-bold font-mono text-[#22D3EE]">
                PROJECT TEAM & FACULTY MENTORS
              </span>
              <span className="rounded-md bg-[#34D399]/15 border border-[#34D399]/30 px-3 py-1 text-xs font-bold font-mono text-[#34D399]">
                B.TECH IOT 2026
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F1F5F9]">
              The Engineering Minds Behind Predict X
            </h2>
            <p className="text-sm text-[#94A3B8]">
              Meet the student engineering team and academic mentors who designed, implemented, and validated this 
              AIoT-based Predictive Maintenance System for Three-Phase AC Induction Motors.
            </p>
          </div>

          
        </div>
      </motion.div>

      {/* 2. Project Mentors Section */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
          <Award className="h-5 w-5 text-[#FBBF24]" />
          <div>
            <h3 className="text-lg font-bold text-[#F1F5F9] flex items-center gap-2">
              Faculty & Technical Mentors
              <span className="text-xs font-mono font-normal text-[#FBBF24] bg-[#FBBF24]/10 border border-[#FBBF24]/30 px-2 py-0.5 rounded">
                Project Supervision
              </span>
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Expert guidance on Cyber-Physical Systems, Electrical Safety, and Scientific Machine Learning Validation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mentors.map((mentor, index) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-[#1E293B] bg-gradient-to-b from-[#111B2E] to-[#0B1220] p-6 relative overflow-hidden group shadow-xl hover:border-[#FBBF24]/40 transition-all"
            >
              <div className="absolute top-0 right-0 h-28 w-28 bg-[#FBBF24]/5 rounded-bl-full pointer-events-none group-hover:bg-[#FBBF24]/10 transition-colors" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Photo with Glowing Ring */}
                <div className="relative shrink-0">
                  <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-[#FBBF24]/50 p-1 bg-[#172338] shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={mentor.photoUrl}
                      alt={mentor.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=172338&color=FBBF24&size=128&bold=true`;
                      }}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-[#FBBF24] text-[#0B1220] p-1 rounded-full shadow">
                    <Award className="h-4 w-4" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Photo URL or path (e.g. /images/Mentor1.jpeg)"
                        value={mentor.photoUrl}
                        onChange={(e) => handleMentorChange(mentor.id, "photoUrl", e.target.value)}
                        className="w-full bg-[#0B1220] border border-[#1E293B] px-2.5 py-1 rounded text-xs text-[#64748B] font-mono"
                      />
                      <input
                        type="text"
                        value={mentor.name}
                        onChange={(e) => handleMentorChange(mentor.id, "name", e.target.value)}
                        className="w-full bg-[#0B1220] border border-[#1E293B] px-2.5 py-1 rounded text-sm text-[#F1F5F9] font-bold"
                      />
                      <input
                        type="text"
                        value={mentor.designation}
                        onChange={(e) => handleMentorChange(mentor.id, "designation", e.target.value)}
                        className="w-full bg-[#0B1220] border border-[#1E293B] px-2.5 py-1 rounded text-xs text-[#FBBF24]"
                      />
                      <input
                        type="text"
                        value={mentor.department}
                        onChange={(e) => handleMentorChange(mentor.id, "department", e.target.value)}
                        className="w-full bg-[#0B1220] border border-[#1E293B] px-2.5 py-1 rounded text-xs text-[#94A3B8]"
                      />
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-base font-extrabold text-[#F1F5F9] group-hover:text-[#FBBF24] transition-colors">
                        {mentor.name}
                      </h4>
                      <p className="text-xs font-semibold text-[#FBBF24]">{mentor.designation}</p>
                      <p className="text-xs text-[#94A3B8]">{mentor.department}</p>
                      <p className="text-xs text-[#64748B]">{mentor.institution}</p>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 text-xs text-[#94A3B8]">
                    <Mail className="h-3.5 w-3.5 text-[#FBBF24]" />
                    <span className="font-mono text-[11px]">{mentor.email}</span>
                  </div>
                </div>
              </div>

              {/* Mentorship Focus */}
              <div className="mt-5 pt-4 border-t border-[#1E293B] space-y-2 text-xs">
                <div>
                  <span className="text-[#94A3B8] block text-[11px] font-semibold uppercase">
                    Core Specialization:
                  </span>
                  <span className="text-[#E2E8F0] font-medium">{mentor.specialization}</span>
                </div>

                <div>
                  <span className="text-[#94A3B8] block text-[11px] font-semibold uppercase">
                    Project Mentorship Focus:
                  </span>
                  <span className="text-[#FBBF24] font-medium">{mentor.mentorshipArea}</span>
                </div>

                <div className="pt-1">
                  <span className="text-[#94A3B8] block text-[11px] font-semibold uppercase mb-1">
                    Guidance Highlights:
                  </span>
                  <ul className="space-y-1 text-[#CBD5E1]">
                    {mentor.guidanceHighlights.map((gh, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#FBBF24] mt-0.5">•</span>
                        <span>{gh}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 3. Student Engineering Team Section */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
          <GraduationCap className="h-5 w-5 text-[#22D3EE]" />
          <div>
            <h3 className="text-lg font-bold text-[#F1F5F9] flex items-center gap-2">
              Student Engineering Team
              <span className="text-xs font-mono font-normal text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/30 px-2 py-0.5 rounded">
                3 Core Members
              </span>
            </h3>
            <p className="text-xs text-[#94A3B8]">
              3rd-Year IoT & Computer Engineering Students responsible for hardware, firmware, ML pipeline, and web architecture
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.12 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="rounded-2xl border border-[#1E293B] bg-gradient-to-b from-[#111B2E] via-[#0B1220] to-[#172338] p-5 flex flex-col justify-between group shadow-xl hover:border-[#22D3EE]/40 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 h-20 w-20 bg-[#22D3EE]/5 rounded-bl-full pointer-events-none group-hover:bg-[#22D3EE]/15 transition-colors" />

              <div className="space-y-4">
                {/* Photo & Role Badge */}
                <div className="flex flex-col items-center text-center">
                  <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-[#22D3EE]/40 p-1 bg-[#172338] shadow-md group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=172338&color=22D3EE&size=128&bold=true`;
                      }}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  </div>

                  <div className="mt-3 w-full">
                    {isEditing ? (
                      <div className="space-y-1.5 w-full">
                        <input
                          type="text"
                          placeholder="Photo path (e.g. /images/himesh.png)"
                          value={member.photoUrl}
                          onChange={(e) => handleMemberChange(member.id, "photoUrl", e.target.value)}
                          className="w-full bg-[#0B1220] border border-[#1E293B] px-2 py-0.5 rounded text-[10px] text-[#64748B] font-mono text-center"
                        />
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => handleMemberChange(member.id, "name", e.target.value)}
                          className="w-full bg-[#0B1220] border border-[#1E293B] px-2 py-0.5 rounded text-xs text-[#F1F5F9] font-bold text-center"
                        />
                        <input
                          type="text"
                          value={member.role}
                          onChange={(e) => handleMemberChange(member.id, "role", e.target.value)}
                          className="w-full bg-[#0B1220] border border-[#1E293B] px-2 py-0.5 rounded text-[11px] text-[#22D3EE] text-center"
                        />
                        <input
                          type="text"
                          value={member.enrollmentNo}
                          onChange={(e) => handleMemberChange(member.id, "enrollmentNo", e.target.value)}
                          className="w-full bg-[#0B1220] border border-[#1E293B] px-2 py-0.5 rounded text-[10px] text-[#94A3B8] font-mono text-center"
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className="text-base font-extrabold text-[#F1F5F9] group-hover:text-[#22D3EE] transition-colors">
                          {member.name}
                        </h4>
                        <p className="text-xs font-semibold text-[#22D3EE] mt-0.5">{member.role}</p>
                        <div className="mt-1 flex items-center justify-center gap-1.5">
                          <span className="text-[10px] font-mono bg-[#172338] border border-[#1E293B] px-2 py-0.5 rounded text-[#94A3B8]">
                            Enroll: {member.enrollmentNo}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Academic Metadata */}
                <div className="rounded-lg bg-[#0B1220]/70 border border-[#1E293B] p-2.5 text-[11px] space-y-1">
                  <div className="text-[#94A3B8] leading-tight font-medium">
                    {member.branch}
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    {member.institution}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#34D399] font-mono truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>

                {/* Key Responsibilities */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase block">
                    Key Responsibilities:
                  </span>
                  <ul className="space-y-1 text-[11px] text-[#CBD5E1]">
                    {member.responsibilities.map((resp, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-[#22D3EE]">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Skills Tags & Social Links */}
              <div className="mt-4 pt-3 border-t border-[#1E293B] space-y-3">
                <div className="flex flex-wrap gap-1">
                  {member.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="rounded bg-[#172338] px-1.5 py-0.5 text-[10px] font-mono text-[#94A3B8]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-1 text-[#94A3B8]">
                  <a
                    href={member.linkedin || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#22D3EE] transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={member.github || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#F1F5F9] transition-colors"
                    title="GitHub"
                  >
                    <Github className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 4. Collaboration & Department Attribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="rounded-xl border border-[#1E293B] bg-[#111B2E] p-5 text-center text-xs text-[#94A3B8] space-y-2"
      >
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#F1F5F9]">
          <Sparkles className="h-4 w-4 text-[#22D3EE]" />
          Project Developed Under IoT & Embedded Machine Learning Capstone
        </div>
        <p className="max-w-2xl mx-auto text-[11px] text-[#64748B] leading-relaxed">
          Special thanks to our mentors and the Department of IoT Engineering for providing laboratory testbed equipment,
          calibrated current transformers, vibration accelerometers, and high-voltage motor safety gear.
        </p>
      </motion.div>
    </div>
  );
};
