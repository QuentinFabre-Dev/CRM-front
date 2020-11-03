import React, { useState,useEffect } from "react";
import { useForm, useStep } from "react-hooks-helper";
import { Etude } from "./stepForm/Etude";
import { Budget } from "./stepForm/Budget";
import { Client } from "./stepForm/Client";
import { Contact } from "./stepForm/Contact";
import { Review } from "./stepForm/Review";
import { Submit } from "./stepForm/Submit";
import { SubmitError } from "./stepForm/SubmitError";

import { useLocation } from "react-router";  

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

function useQuery() {
  return new URLSearchParams(useLocation().search);
}


export default function MultiStepForm (){
  let query = useQuery();
  

  const [formData, setForm] = useForm(defaultData);
  const [phasesList, setPhasesList] = useState([]);
  const [totalPhase, settotalPhase] = useState()
  const [dataLoaded, setdataLoaded] = useState()
  
  const { step, navigation } = useStep({
    steps,
    initialStep: 0,
  });

  useEffect(() => {
    if(query.get("idPC")){
      fetch('https://cri-front.herokuapp.com/api/pc/'+query.get("idPC"), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
        method: "GET"
      })
        .then(res => res.json())
        .then(res => setdataLoaded(res))
    } 
    
  }, [])

  
  function setPhases (item,total) {
    setPhasesList(item)
    settotalPhase(total)
    navigation.next()
  }
  
  const props = { formData, setForm, navigation, setPhases,phasesList,totalPhase};
  
  if(dataLoaded){
    defaultData.reference = dataLoaded.reference
    defaultData.typeEtude  = dataLoaded.typeEtude
    defaultData.nomEtude = dataLoaded.nomEtude
    defaultData.nomClient = dataLoaded.nomClient
    defaultData.mail = dataLoaded.mail
    defaultData.tel = dataLoaded.tel
    defaultData.cdp  = dataLoaded.cdp
    defaultData.dateDebut  = dataLoaded.dateDebut
    defaultData.dateFin  = dataLoaded.dateFin
    defaultData.description  = dataLoaded.description
    defaultData.totalJEH = dataLoaded.totalJEH
    defaultData.totalSemaine  = dataLoaded.totalSemaine
    defaultData.TotalPrix = dataLoaded.TotalPrix
  }

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
