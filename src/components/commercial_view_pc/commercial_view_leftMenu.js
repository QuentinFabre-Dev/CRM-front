import React from 'react'
import Button from "@material-ui/core/Button";
import Divider from '@material-ui/core/Divider';
import Popup from  './Popup';

import DeleteIcon from '@material-ui/icons/Delete';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import Icon from '@material-ui/core/Icon';
import SendIcon from '@material-ui/icons/Send';
import CheckIcon from '@material-ui/icons/Check';
import DoneAllIcon from '@material-ui/icons/DoneAll';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import GavelIcon from '@material-ui/icons/Gavel';

import { Link, useLocation, BrowserRouter as Router } from "react-router-dom";  


function useQuery() {
    return new URLSearchParams(useLocation().search);
  }

export default function LeftMenu() {
    let query = useQuery();

    const deleteItem = (id) =>{
        fetch(`http://localhost:5000/api/pc/delete/${id}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
            method: "POST"
          })
          .then(res => res.json())
          .then(console.log("Delete"))
      }

    return (
        <div className='bg-white p-4 mt-5' style={{width:300}}>
        {/* <Button variant="outlined" endIcon={<ArrowForwardIcon />} fullWidth color="primary" style={{ marginTop: "1rem" }}>
            Etape suivante
        </Button>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} fullWidth color="primary" style={{ marginTop: "1rem" }}>
            Etape Précédente
        </Button> */}
        
        
        <Divider variant="middle" style={{marginTop:10}} />

        <Button variant="outlined" startIcon={<CheckIcon/>} fullWidth color="primary" style={{ marginTop: "1rem" }}>
            Validation qualité
        </Button>
        <Button variant="outlined" startIcon={<DoneAllIcon/>} fullWidth color="primary" style={{ marginTop: "1rem" }}>
            Validation présidence
        </Button>

        <Divider variant="middle" style={{marginTop:10}} />

        <Button variant="outlined" startIcon={<SendIcon/>} fullWidth color="primary" style={{ marginTop: "1rem" }}>
            PC envoyé
        </Button>

        <Divider variant="middle" style={{marginTop:10}} />

        <Button variant="contained" startIcon={<CloudUploadIcon />} fullWidth color="primary" style={{ marginTop: "1rem" }}>
            Télécharger la PC
        </Button>

        {/* <Button variant="contained" startIcon={<DeleteIcon />}  onClick={() =>deleteItem(query.get("idPC"))} fullWidth color="secondary" style={{ marginTop: "1rem" }}>
            Supprimer la PC
        </Button> */}
        <Popup />
        
        <Divider variant="middle" style={{marginTop:10}} />

        <Button variant="contained" startIcon={<GavelIcon/>} fullWidth color="primary" style={{ marginTop: "1rem", backgroundColor:"#2ecc71" }}>
            Convertir en étude
        </Button>

        </div>
    )
}
