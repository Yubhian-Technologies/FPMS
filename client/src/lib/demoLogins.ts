export type DemoRole =
  | "faculty"
  | "hod"
  | "dean"
  | "principle"
  | "committee"
  | "superadmin";

export interface DemoLoginCredential {
  role: DemoRole;
  email: string;
  password: string;
  name: string;
}

export const DEMO_LOGIN_CREDENTIALS: DemoLoginCredential[] = [
  {
    role: "faculty",
    email: "faculty@demo.edu",
    password: "demo123",
    name: "Demo Faculty",
  },
  {
    role: "hod",
    email: "hod@demo.edu",
    password: "demo123",
    name: "Demo HoD",
  },
  {
    role: "dean",
    email: "dean@demo.edu",
    password: "demo123",
    name: "Demo Dean",
  },
  {
    role: "principle",
    email: "admin@demo.edu",
    password: "demo123",
    name: "Demo Admin",
  },
  {
    role: "committee",
    email: "committee@demo.edu",
    password: "demo123",
    name: "Demo Committee",
  },
  {
    role: "superadmin",
    email: "superadmin@demo.edu",
    password: "demo123",
    name: "Super Admin",
  },
];
