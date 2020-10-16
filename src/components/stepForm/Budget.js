import React, { useState,useEffect } from 'react';
import Container from "@material-ui/core/Container";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import DeleteOutlineOutlinedIcon from '@material-ui/icons/DeleteOutlineOutlined';
import Badge from '@material-ui/core/Badge';
import Divider from '@material-ui/core/Divider';

export const Budget = ({ formData, setForm, navigation,setPhases }) => {
  const { listPhases } = formData;

  const [total, settotal] = useState({semaine :1,JEH:1,prix : 400})

  const [inputList,setInputList] = useState([
    {phase : "Analyse et conception", semaine :1 , NbJEH : 1,PrixJEH : 400}
  ])
  
  useEffect(() => {
    update()
  },[inputList])


  const handleChange = (e,index) =>{
    if(e.target.value <= 0 && e.target.value !== "" )
      alert('Impossible...')
    else{
    const {name,value} = e.target;
    const list = [...inputList];
    list[index][name] = value;
    setInputList(list)
    update()
    }
    
  }

  const update = () =>{
    var sem = 0
    var jeh =0
    var prix =0 

    for(let i=0;i<inputList.length;i++){
      sem += parseInt(inputList[i].semaine)
      prix += parseInt(inputList[i].NbJEH*inputList[i].PrixJEH)
      jeh += parseInt(inputList[i].NbJEH)
    }
    settotal({semaine : sem,JEH:jeh,prix : prix})
  }

  const handleAddInput = () =>{
    setInputList([...inputList,{phase : "", semaine :1 , NbJEH : 1, PrixJEH : 400}])
    
  }

  const handleRemoveInput = (index) =>{
    const list = [...inputList];
    list.splice(index,1);
    setInputList(list)
  }

  const valid = () =>{
    setPhases(inputList,total)
    navigation.next()
  }

  return (
    <Container maxWidth="md">
      <h3>Informations Etude</h3>
      <hr></hr>
      
      {inputList.map((item,i)=>{
          return(
            <span key={i}>

              <button style={{width:'8%'}}>
                <DeleteOutlineOutlinedIcon style={{color:'lightgray'}} onClick={()=>handleRemoveInput(i)} /> 
              </button>
            <TextField
                style={{width:'45%'}}
                label={"Phases"}
                name="phase"
                value={item.phase}
                onChange={e => handleChange(e,i)}
                margin="normal"
                variant="outlined"
                autoComplete="off"
              />

              <TextField
                style={{width:'15%'}}
                label="Semaine"
                name="semaine"
                type="number"
                value={item.semaine}
                onChange={e => handleChange(e,i)}
                margin="normal"
                variant="outlined"
                autoComplete="off"
              />

              <TextField
                style={{width:'15%'}}
                label="Nb JEH"
                name="NbJEH"
                type="number"
                value={item.NbJEH}
                onChange={e => handleChange(e,i)}
                margin="normal"
                variant="outlined"
                autoComplete="off"
              />
              <TextField
                style={{width:'15%'}}
                label="Prix JEH"
                name="PrixJEH"
                type="number"
                value={item.PrixJEH}
                onChange={e => handleChange(e,i)}
                margin="normal"
                variant="outlined"
                autoComplete="off"
                helperText="Entre 80 et 400"
              />
              <Badge badgeContent={item.NbJEH*item.PrixJEH+'€'} max={100000} color="primary"></Badge>
              
          </span>
          
          )
      })}
      
      <Divider />
      <div className='flex flex-row justify-end'>
              <TextField
                disabled
                style={{width:'15%'}}
                label={total.semaine +' Semaine(s)'}
                name="semaine"
                type="number"
                margin="normal"
              />

              <TextField
                disabled
                style={{width:'15%'}}
                label={total.JEH +' JEH'}
                name="NbJEH"
                type="number"
                value="P"
                margin="normal"
              />
              <TextField
                disabled
                style={{width:'15%'}}
                label={total.prix +' €'}
                name="PrixJEH"
                type="number"
                value="p"
                margin="normal"
              />
      </div>
      <Button
        variant="contained"
        fullWidth
        color="secondary"
        style={{ marginTop: "1rem" }}
        onClick={handleAddInput}
      >
        Ajouter une phases
      </Button>
      <Button
        variant="contained"
        fullWidth
        color="primary"
        style={{ marginTop: "1rem" }}
        onClick={() => valid()}
      >
        Continuer
      </Button>
    </Container>
    
  );
};
