import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import {Redirect} from 'react-router-dom';

import { Link, useLocation, BrowserRouter as Router } from "react-router-dom";  

function useQuery() {
    return new URLSearchParams(useLocation().search);
  }

export default function AlertDialog() {
  let query = useQuery();
  const [open, setOpen] = React.useState(false);
  const [redirect, setredirect] = React.useState("")

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const deleteItem = (id) =>{
    fetch(`https://cri-front.herokuapp.com/api/pc/delete/${id}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
        method: "POST"
      })
      .then(res => res.json())
      .then(setredirect('/commercial'))
  }

  return (
      <div>
      {redirect ? <Redirect to={redirect} /> : null}
      {/* <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Open alert dialog
        () => deleteItem(query.get("idPC"))
      </Button> */}

      <Button variant="contained" startIcon={<DeleteIcon />}  onClick={handleClickOpen} fullWidth color="secondary" style={{ marginTop: "1rem" }}>
            Supprimer la PC
        </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Voulez-vous vraiment supprimer cette proposition commerciale ?"}</DialogTitle>
        <DialogContent>
          {/* <DialogContentText id="alert-dialog-description">
            Voulez-vous vraiment supprimer cette proposition commerciale ?
          </DialogContentText> */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Non
          </Button>
          <Button onClick={() => deleteItem(query.get("idPC"))} color="primary" autoFocus>
            Oui
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
