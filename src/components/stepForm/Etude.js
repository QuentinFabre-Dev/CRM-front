import React from "react";
import Container from "@material-ui/core/Container";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Select from '@material-ui/core/Select';  
import InputLabel from '@material-ui/core/InputLabel';  
import MenuItem from '@material-ui/core/MenuItem'; 

import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker,
} from '@material-ui/pickers';

export const Etude = ({ formData, setForm, navigation }) => {
  const { reference, nomEtude,typeEtude,cdp,dateDebut,dateFin,description } = formData;
  const [selectedDate, setSelectedDate] = React.useState(new Date('2014-08-18T21:11:54'));

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };
  return (
    <Container maxWidth="xs">
      <h3>Informations Etude</h3>
      <hr></hr>
      <TextField
        label="Référence"
        name="reference"
        value={reference}
        onChange={setForm}
        margin="normal"
        variant="outlined"
        autoComplete="off"
        fullWidth
      />
      <TextField
        label="Nom de l'étude"
        name="nomEtude"
        value={nomEtude}
        onChange={setForm}
        margin="normal"
        variant="outlined"
        autoComplete="off"
        fullWidth
      />
      <InputLabel id="demo-simple-select-outlined-label">Type</InputLabel>
      <Select
        label="Type"
        labelId="demo-simple-select-outlined-label"
        name="typeEtude"
        value={typeEtude}
        onChange={setForm}
        margin="normal"
        variant="outlined"
        autoComplete="off"
        fullWidth
      >
        <MenuItem value="Web">Site web</MenuItem>
        <MenuItem value="Mobile">Application Mobile</MenuItem>
        <MenuItem value="Etude">Science de l'entreprise</MenuItem>
      </Select>
      
      {/* <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <KeyboardDatePicker
            margin="normal"
            name="dateDebut"
            id="date-picker-dialog"
            label="Date début"
            format="dd/MM/yyyy"
            value={dateDebut}
            onChange={setForm}
            KeyboardButtonProps={{
              'aria-label': 'change date',
            }}
          />
          <KeyboardDatePicker
            margin="normal"
            name = "dateFin"
            id="date-picker-dialog"
            label="Date fin"
            format="dd/MM/yyyy"
            value={dateFin}
            onChange={setForm}
            KeyboardButtonProps={{
              'aria-label': 'change date',
            }}
          />
        </MuiPickersUtilsProvider> */}
      <TextField
        label="Date début (J/M/Y)"
        name="dateDebut"
        value={dateDebut}
        onChange={setForm}
        margin="normal"
        variant="outlined"
        autoComplete="off"
      />
      <TextField
        label="Date Fin (J/M/Y)"
        name="dateFin"
        value={dateFin}
        onChange={setForm}
        margin="normal"
        variant="outlined"
        autoComplete="off"
      />
      <TextField
        label="Chef de projet"
        name="cdp"
        value={cdp}
        onChange={setForm}
        margin="normal"
        variant="outlined"
        autoComplete="off"
        fullWidth
      />
      <TextField
        label="Description rapide"
        name="description"
        value={description}
        onChange={setForm}
        margin="normal"
        variant="outlined"
        autoComplete="off"
        fullWidth
      />

      <Button
        variant="contained"
        fullWidth
        color="primary"
        style={{ marginTop: "1rem" }}
        onClick={() => navigation.next()}
      >
        Continuer
      </Button>
    </Container>
  );
};
