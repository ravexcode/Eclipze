"use client";

import { useState } from "react";

import UserCredentials from "@/types/user";

import Form from "@/components/forms/auth/form";
import Input from "@/components/forms/auth/input";
import Button from "@/components/ui/button";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";


export default function AuthPage(
  { type }:
  { type: "in" | "up" }
) {
  const defaultUser = type === "in" ? { email: "", password: "" } : { email: "", username: "", password: "", password_confirm: "" };

  const [user, setUser] = useState<UserCredentials>(defaultUser);

  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {

  };

  const onError = (e: React.SubmitEvent<HTMLFormElement>) => {

  };

  const greeting = type === "in" ? "Welcome back!" : "Get started!";

  return (
    <div
      className="w-full flex items-center justify-center p-10 min-h-dvh">
      <Link
        className="fixed top-6 left-6 flex gap-1 text-sm items-center justify-center text-center"
        href="/">
        <IconArrowLeft
          size={15} />
        <p>
          Go back
        </p>
      </Link>

      <Form
        onSubmit={onSubmit}
        onError={onError}>

        <h1 className="font-heading text-3xl mb-2"> {greeting} </h1>

        { /* Inputs */ }
        {
          type === "in" ? <>
            <Input
              value={user.email}
              onChange={(e) => {
                setUser(
                  prev => prev ? {
                    ...prev,
                    email: e.target.value
                  } : prev
                );
              }}
              label="Insert your email"
              type="email"
              placeholder="eclipse@mail.com"
            />

            <Input
              value={user.password}
              onChange={(e) => {
                setUser(
                  prev => prev ? {
                    ...prev,
                    password: e.target.value
                  } : prev
                );
              }}
              label="Insert your password"
              type="password"
              placeholder="••••••••••"
            />

          </> : <>

            <Input
              value={user.username!}
              onChange={(e) => {
                setUser(
                  prev => prev ? {
                    ...prev,
                    username: e.target.value
                  } : prev
                );
              }}
              label="Create a username"
              type="text"
              placeholder="Eclipse "
              />

            <Input
              value={user.email}
              onChange={(e) => {
                setUser(
                  prev => prev ? {
                    ...prev,
                    email: e.target.value
                  } : prev
                );
              }}
              label="Insert your email"
              type="email"
              placeholder="eclipse@mail.com"
              />

            <Input
              value={user.password}
              onChange={(e) => {
                setUser(
                  prev => prev ? {
                    ...prev,
                    password: e.target.value
                  } : prev
                );
              }}
              label="Insert your password"
              type="password"
              placeholder="••••••••••"
              />

            <Input
              value={user.password_confirm!}
              onChange={(e) => {
                setUser(
                  prev => prev ? {
                    ...prev,
                    password_confirm: e.target.value
                  } : prev
                );
              }}
              label="Confirm your password"
              type="password"
              placeholder="••••••••••"
              />

          </>
        }

        <Button
          type="submit"
          variant="main"
          className="w-full mt-5 cursor-pointer">
          Continue
        </Button>

        { /*Legal*/ }
        {
          type === "in" &&
          <p
            className="text-sm text-foreground-off w-full text-center mb-2">
            By signin in you accept our <Link
              href="/legal/tos"
              className="hover:text-accent duration-300 underline">
              Terms of service
            </Link> and <Link
              href="/legal/privacy"
              className="hover:text-accent duration-300 underline">
              Privacy policy
            </Link>
          </p>
        }

        {
          type === "up" &&
          <div
            className="w-full inline-flex gap-1 text-sm text-foreground-off justify-center items-center text-center mb-2">
              <input
                type="checkbox"
                className="outline-none"/>

              I accept the <Link
                href="/legal/tos"
                className="hover:text-accent duration-300 underline">
                Terms of service
              </Link> and <Link
                href="/legal/privacy"
                className="hover:text-accent duration-300 underline">
                Privacy policy
              </Link>
          </div>
        }

        { /*Redirections*/ }
        <p
          className="text-sm text-foreground-off w-full text-center">
          { type === "in" ? "Don't have an account?" : "Already have an account?" } <Link
            href={ type === "in" ? "/auth/signup" : "/auth/signin" }
            className="hover:text-accent duration-300 underline">
              {type === "in" ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </Form>
    </div>
  );
}
