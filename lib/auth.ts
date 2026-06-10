import { supabase } from "./supabase";

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  teamName: string
): Promise<{ user: any; error: any }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          full_name: fullName,
          team_name: teamName,
          email,
        });

      if (profileError) throw profileError;

      return { user: authData.user, error: null };
    }

    return { user: null, error: "Erro desconhecido" };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: any; error: any }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function getCurrentUser() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    return null;
  }
}
