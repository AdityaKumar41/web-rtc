"use client";
import React, { FormEvent, useContext, useState } from "react";
import Login from "../components/Login";
import { Context } from "../store/context";

const page = () => {
  const { user } = useContext(Context);
  console.log(user);
  return <div className="bg-black h-screen w-screen ">{<Login />}</div>;
};

export default page;
