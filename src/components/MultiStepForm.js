import React, { useState } from "react";
import { useForm, useStep } from "react-hooks-helper";
import { Etude } from "./stepForm/Etude";
import { Budget } from "./stepForm/Budget";
import { Client } from "./stepForm/Client";
import { Contact } from "./stepForm/Contact";
import { Review } from "./stepForm/Review";
import { Submit } from "./stepForm/Submit";
import { SubmitError } from "./stepForm/SubmitError";


const defaultData = {
  reference: "",
  typeEtude : "",
  nomEtude: "",
  nomClient: "",
  mail: "",
  tel: "",
  cdp : "",
  dateDebut : "",
  dateFin : "",
  description : "",
  totalJEH :"",
  totalSemaine : "",
  TotalPrix : ""
};

const steps = [
  { id: "etude" },
  { id: "client" },
  { id: "budget" },
  { id: "review" },
  { id: "submit" },
  { id: "submitError" },
];


export default function MultiStepForm (){
  const [formData, setForm] = useForm(defaultData);
  const [phasesList, setPhasesList] = useState([]);
  const [totalPhase, settotalPhase] = useState()
  
  const { step, navigation } = useStep({
    steps,
    initialStep: 0,
  });

  
  function setPhases (item,total) {
    setPhasesList(item)
    settotalPhase(total)
    navigation.next()
  }
  
  const props = { formData, setForm, navigation, setPhases,phasesList,totalPhase};

  switch (step.id) {
    case "etude":
      return <Etude {...props} />;
    case "client":
      return <Client {...props} />;
    case "budget":
      return <Budget {...props} />;
    case "review":
      return <Review {...props} />;
    case "submit":
      return <Submit {...props} />;
    case "submitError":
      return <SubmitError {...props} />;
  }

  return (
    <div>
      <h1>Multi step form</h1>
    </div>
  );
};
