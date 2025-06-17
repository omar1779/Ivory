"use client";
import { Amplify } from "aws-amplify";
import amplifyConfig from "../../../amplify_outputs.json";
import { useEffect } from "react";

export default function AmplifyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log("Amplify config loaded:", amplifyConfig);
    Amplify.configure(amplifyConfig);
  }, []);

  return <>{children}</>;
}