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
import DeleteOutlineOutlinedIcon from '@material-ui/icons/DeleteOutlineOutlined';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';

import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import SearchIcon from '@material-ui/icons/Search';

import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';


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
    fetch('https://cri-front.herokuapp.com/api/'+props.data, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
        method: "GET"
      })
        .then(res => res.json())
        .then(res => setdataPC(res))
    
  },[setdataPC])

  // const [anchorEl, setAnchorEl] = React.useState(null);

  // const handleClick = (event) => {
  //   setAnchorEl(event.currentTarget);
  // };

  // const handleClose = () => {
  //   setAnchorEl(null);
  // };

  const deleteItem = (id) =>{
    // var url = new URL("http://localhost:5000/api/pc/delete"),
    // params = {idPC:id}
    // Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    
    fetch(`https://cri-front.herokuapp.com/api/pc/delete/${id}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
        method: "POST"
      })
      .then(res => res.json())
      .then(res => setdataPC(res))
  }

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
          {dataPC.map((row) => (
            <TableRow key={row.reference}>
              <TableCell align="left">{row.reference}</TableCell>
              <TableCell align="left">{row.nomClient}</TableCell>
              <TableCell align="left">{row.description}</TableCell>
              <TableCell align="left">{row.cdp}</TableCell>
              <TableCell align="left"><Status status={row.typeEtude}/></TableCell>
              <TableCell align="left"><Status status="Validation Q"/></TableCell>
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
              <TableCell align="center">
                {/* <IconButton aria-label="delete" onClick={() =>deleteItem(row.reference)}>
                  <DeleteIcon />
                </IconButton> */}
                <Link to={{
                    pathname: "/commercial/pc/view",
                    search: `?idPC=${row.reference}`,
                  }}>
                    <SearchIcon />
                </Link>
              </TableCell>

              {/* <TableCell align="center">
              <div>
                  <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
                    <MoreHorizIcon/>
                  </Button>
                  <Menu
                    id="simple-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem onClick={handleClose}>Voir</MenuItem>
                    <MenuItem onClick={handleClose,()=> deleteItem(row.reference)}>Supprimer</MenuItem>
                  </Menu>
                </div>
              </TableCell> */}

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    </span>
  );
}