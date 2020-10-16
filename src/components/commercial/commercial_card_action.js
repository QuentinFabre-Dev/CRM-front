import React from 'react'
import HighlightOffIcon from '@material-ui/icons/HighlightOff';


export default function CommercialCardAction(props) {
    const color = props.color
      
    return(
        <a href='/commercial/add/pc' className={"flex flex-row mt-5 pb-3 rounded-lg bg-white shadow font-bold w-full"}>
           <span className='flex flex-col' style={{width:'70%'}}>
            <div className="flex mt-1 text-xm pt-2 pl-2" >
                    <HighlightOffIcon style={{color:'#D8814F',marginLeft:5,marginRight:5}}/> 
                    <h1 style={{color:'#D8814F'}}>Voir les études</h1>
                </div>
                <p className='text-xs font-thin pl-5'>Consulter les documents des études</p>
           </span>
            <span className="flex bg-red-500" style={{width:'30%'}}>
                <img src='../../assets/images/etudes.png' />
            </span>
        </a>
    )
}