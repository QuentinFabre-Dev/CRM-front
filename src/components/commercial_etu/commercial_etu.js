import * as React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

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

const rows = [
  createData('CHR02_SG13', "Chr Hansen", "ERP internet et génération de PDF", "Hugo Abrikh","Web","En cours","12/01/20",'17/03/21',"9"),
  createData('CHR02_SG13', "Chr Hansen", "ERP internet et génération de PDF", "Hugo Abrikh","App Mobile","En cours","12/01/20",'17/03/21',"5"),
  createData('CHR02_SG13', "Chr Hansen", "ERP internet et génération de PDF", "Hugo Abrikh","Web","En cours","12/01/20",'17/03/21',"-5"),
  createData('CHR02_SG13', "Chr Hansen", "ERP internet et génération de PDF", "Hugo Abrikh","Web","Terminé","12/01/20",'17/03/21',"OK"),
];
export default function CommercialEtu() {
  const classes = useStyles();

  return (
    <span className='mt-5' style={{overflow:'scroll'}}>
      <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Ref.</TableCell>
            <TableCell align="right">Client</TableCell>
            <TableCell align="right">Description</TableCell>
            <TableCell align="right">CDP</TableCell>
            <TableCell align="right">Type</TableCell>
            <TableCell align="right">Statut</TableCell>
            <TableCell align="right">Debut</TableCell>
            <TableCell align="right">Fin</TableCell>
            <TableCell align="right">Délais</TableCell>

          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell align="right">{row.ref}</TableCell>
              <TableCell align="right">{row.client}</TableCell>
              <TableCell align="right">{row.description}</TableCell>
              <TableCell align="right">{row.cdp}</TableCell>
              <TableCell align="right"><Status status={row.type}/></TableCell>
              <TableCell align="right"><Status status={row.status}/></TableCell>
              <TableCell align="right">{row.debut}</TableCell>
              <TableCell align="right">{row.fin}</TableCell>
              <TableCell align="right"><Delais status={row.delais}/></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    </span>
  );
}