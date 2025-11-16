//import { cookies } from 'next/headers';
//import { jwtVerify } from 'jose';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  companyId: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    /*const token = cookies().get('auth-token')?.value;

    if (!token) {
      return null;
    }*/

    // Décoder le JWT
//const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    //const { payload } = await jwtVerify(token, secret);

    // Option 1: Si toutes les infos sont dans le JWT
    /*return {
      id: payload.sub as string,
      email: payload.email as string,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
      avatar: payload.avatar as string | undefined,
      companyId: payload.companyId as string,
    };*/

    return {
      id: "ZDZ3214",
      email: "gamusta@gmail.com",
      firstName: "Mustapha",
      lastName: "GANGA",
      avatar: "https://github.com/shadcn.png",
      companyId: "eeee",
    }

    // Option 2: Si besoin de fetch les infos complètes depuis l'API
    // const res = await fetch(`${process.env.API_URL}/auth/me`, {
    //   headers: { Authorization: `Bearer ${token}` },
    //   cache: 'no-store',
    // });
    //
    // if (!res.ok) return null;
    // return res.json();

  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}
