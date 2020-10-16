import React from 'react'
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiTextField-root': {
      margin: theme.spacing(2),
      width: '25ch',
    },
  },
}));

export default function CommercialFormpc(props) {
    const classes = useStyles();
    return(
        <div className='flex bg-white shadow px-5 py-2' style={{margin:"auto",width:'50%'}}>
            <form noValidate className={classes.root} autoComplete="off" style={{width:'100%'}}>
                <div className="flex  flex-row flex-wrap justify-between align-center ">
                    <TextField required id="standard-required" label="Référence" style={{width:'100%'}} />
                    <TextField required id="standard-required" label="Nom du projet" style={{width:'40%'}} />
                    <TextField required id="standard-required" label="Type du projet" style={{width:'40%'}}  />
                    <TextField required id="standard-required" label="Nom du projet" style={{width:'1000%'}} />
                </div>
            </form>
        </div>
    )
}