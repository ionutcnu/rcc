import { NextResponse } from "next/server"

export async function POST() {
    // Return an error response indicating registration is disabled
    return NextResponse.json(
        {
            success: false,
            error: "Registration is currently disabled",
        },
        { status: 403 },
    )
}

/* Original registration code - commented out for future use
import { NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json()

    // Create the user in Firebase
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName,
    })

    return NextResponse.json({ success: true, uid: userRecord.uid })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    )
  }
}
*/
