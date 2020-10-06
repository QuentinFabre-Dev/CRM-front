import React from 'react'
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import CircularProgressWithLabel from './CircularProgressWithLabel'

export default function CommercialInfo(props) {
    const color = props.color
    return(
        <div className={'flex flex-wrap justify-between bg-white shadow rounded-lg py-5 px-5 w-1/5 card '+color}>
            <span>
                <em className='text-xs' style={{position:'relative',right:10}}>{props.text}</em>
                <h1 className='text-2xl font-bold ml-10' style={{color:'#2c3e50',position:'relative',right:35}}>{props.value}</h1>
            </span>
            <CircularProgressWithLabel value={props.pourcent} />
        </div>
    )
}