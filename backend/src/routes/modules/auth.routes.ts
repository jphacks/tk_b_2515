import { createRoute, z } from "@hono/zod-openapi";
import { supabase } from "../../lib/supabase";
import { createApiRoute } from "../utils";

const auth = createApiRoute();

// Sign up route
const signUpRoute = createRoute({
  method: "post",
  path: "/signup",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            password: z.string().min(6),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: "User created" },
    400: { description: "Bad request" },
    500: { description: "Internal server error" },
  },
});

auth.openapi(signUpRoute, async (c) => {
  const { email, password } = c.req.valid("json");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return c.json({ error: error.message }, 400);
  }
  if (!data.user) {
    return c.json({ error: "Failed to create user" }, 500);
  }

  return c.json({ user: data.user, session: data.session }, 201);
});

// Sign in route
const signInRoute = createRoute({
  method: "post",
  path: "/signin",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            password: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Signed in successfully" },
    400: { description: "Invalid credentials" },
  },
});

auth.openapi(signInRoute, async (c) => {
  const { email, password } = c.req.valid("json");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({ user: data.user, session: data.session }, 200);
});

// Sign out route
auth.post("/signout", async (c) => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  return c.json({ message: "Signed out successfully" });
});

export default auth;
