import React from "react";
import Container from '@material-ui/core/Container';
import Button from '@material-ui/core/Button';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetail from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import ListItemText from '@material-ui/core/ListItemText'

import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';

export const Review = ({ formData, navigation,phasesList}) => {
  const { go } = navigation;
  const {
    reference,
    nomEtude,
    nomClient,
    mail,
    tel,
    typeEtude,
    cdp,
    dateDebut,
    dateFin
  } = formData;

  const valid = (phases) =>{
    fetch('http://localhost:5000/api/pc/add', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
        method: "POST",
        body: JSON.stringify({formData,phases})
      })
        .then(res => res.json())
        .then(lol => console.log(lol));
    go('submit')
  }
  
  return (
    <Container maxWidth='sm'>
      <h3>Vue d'ensemble</h3>
      <RenderAccordion summary="Etude" go={ go } details={[
        { 'Référence ': reference },
        { 'Type Etude ': typeEtude },
        { 'Chef de projet ': cdp },
        { 'Nom étude ': nomEtude },
        { 'Date début ': dateDebut },
        { 'Date fin ': dateFin },
      ]} />
      <RenderAccordion summary="Client" go={ go } details={[
        { 'Nom client ': nomClient },
        { 'Mail client ': mail },
        { 'Tel ': tel },
      ]} />
      <RenderAccordion summary="Budget" go={ go } details={[
      ]} />
      
      <Button
        color="primary"
        variant="contained"
        style={{ marginTop: '1.5rem' }}
        onClick={() => valid(phasesList)}
      >
        Enregistrer la propale
      </Button>

    </Container>
  );
};

export const RenderAccordion = ({ summary, details, go }) => (
  <Accordion>
    <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
    >{summary}</AccordionSummary>
    <AccordionDetail>
      <div>
        { details.map((data, index) => {
          const objKey = Object.keys(data)[0];
          const objValue = data[Object.keys(data)[0]];

          return <ListItemText key={index}>{`${objKey} : ${objValue}`}</ListItemText>

        }) }
        <IconButton
          color="primary"
          component="span"
          onClick={() => go(`${summary.toLowerCase()}`)}
        ><EditIcon /></IconButton>
      </div>
    </AccordionDetail>
  </Accordion>
)
