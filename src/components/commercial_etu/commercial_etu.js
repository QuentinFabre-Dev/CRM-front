import React, { useState,useEffect } from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';


import Status from './commercial_status'
import Delais from './commercial_delais'

const useStyles = makeStyles({
  table: {
    width:'100%'
  },
});

function createData(ref, client, description, cdp, type,status,debut,fin,delais) {
  return { ref, client, description, cdp, type,status,debut,fin,delais };
}

export default function CommercialEtu(props) {
  const classes = useStyles();

  const [dataPC, setdataPC] = useState([])
  const typeEtude = props.data == 'etu'? true:false;

  useEffect(() => {
    fetch('http://localhost:5000/api/'+props.data, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
        method: "GET"
      })
        .then(res => res.json())
        .then(res => setdataPC(res))
    
  },[])

  return (
    <span className='mt-5' style={{overflow:'scroll'}}>
      <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell align="left">Ref.</TableCell>
            <TableCell align="left">Client</TableCell>
            <TableCell align="left">Description</TableCell>
            <TableCell align="left">CDP</TableCell>
            <TableCell align="left">Type</TableCell>
            <TableCell align="left">Statut</TableCell>
            {typeEtude ?
            <span>
              <TableCell align="left">Debut</TableCell>
              <TableCell align="left">Fin</TableCell>
            </span>
            : <>
                <TableCell align="center">JEH</TableCell>
                <TableCell align="center">Semaine</TableCell>
                <TableCell align="center">Prix</TableCell>


              </>
            }
            
            <TableCell align="center"><a href="">Action</a></TableCell>

          </TableRow>
        </TableHead>
        <TableBody>
          {console.log(dataPC)}
          {dataPC.map((row) => (
            <TableRow key={row.reference}>
              <TableCell align="left">{row.reference}</TableCell>
              <TableCell align="left">{row.nomClient}</TableCell>
              <TableCell align="left">{row.description}</TableCell>
              <TableCell align="left">{row.cdp}</TableCell>
              <TableCell align="left"><Status status={row.typeEtude}/></TableCell>
              <TableCell align="left"><Status status="En cours"/></TableCell>
              {typeEtude ?
              <span>
                <TableCell align="left">{row.dateDebut}</TableCell>
                <TableCell align="left">{row.dateFin}</TableCell>
              </span>
               : 
               <>
                <TableCell align="center">{row.totalJEH}</TableCell>
                <TableCell align="center">{row.totalSemaine}</TableCell>
                <TableCell align="center">{row.totalPrix}€</TableCell>


               </>  
               }
              <TableCell align="center"><Link to={`commercial/${props.data}?num=${row.reference}`}><MoreHorizIcon/></Link></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    </span>
  );
}