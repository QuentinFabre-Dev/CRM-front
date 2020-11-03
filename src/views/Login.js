import React, { useState } from 'react';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Cookies from 'universal-cookie';
import { Redirect } from 'react-router-dom';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';

import '../scss/Commercial.css'
const cookies = new Cookies();

export default function Login() {

const useStyles = makeStyles((theme) => ({
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff',
    },
  }));

    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const handleClose = () => {
        setOpen(false);
    };
    const handleToggle = () => {
        setOpen(!open);
    };

    const [logIn, setLogin] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [email, setemail] = useState("")
    const [password, setPassword] = useState("")

    const handleChange = (e) => {
        let type = e.target.name
        if(type === "email")
            setemail(e.target.value)
        else if(type === "password")
            setPassword(e.target.value)
    }

    const login = () => {
        setOpen(true)
        fetch('https://cri-front.herokuapp.com/api/login', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',    
        },
        method: "POST",
        body: JSON.stringify({email : email, password : password})
      })
        .then(res => {
           res.json()
            .then(response => {
                cookies.set('token', response.token)
                setOpen(false)
                setLogin(true)

            })
        })
        .catch(err => console.log(err), setOpen)

  }

    return(
        <div className="app__login" className="flex justify-center">
        <Backdrop className={classes.backdrop} open={open} onClick={handleClose}>
            <CircularProgress color="inherit" />
        </Backdrop>
        <Divider/>
            <form className="flex flex-col bg-white rounded-lg px-4 py-3" style={{width:'30%'}}>
            <label>Connexion</label>
                <TextField 
                    id="standard-secondary"
                    name="email" 
                    onChange={handleChange}
                    type="text" 
                    label="Email JMC" 
                />
                <TextField id="standard-secondary" name="password" onChange={handleChange} type="password" label="Mot de passe"/>
                <Button onClick={login} variant="contained" color="primary" style={{marginTop:30}}>
                    Connexion
                </Button>
            </form>
            {logIn ?  <Redirect to="/" /> : null}
        </div>
    )
}
