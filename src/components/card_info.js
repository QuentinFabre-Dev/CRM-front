import React from 'react'
import LinearProgress from '@material-ui/core/LinearProgress';


export default function card_info(props) {
    return(
        <div className='justify-between shadow mt-5 bg-white text-gray-500 py-3 px-2 rounded-lg px-5' style={{width:'30%'}}>
            <div className='flex flex-row'>  
                <div className="flex flex-col w-1/2">
                    <h1 className='font-bold text-gray-800'>{props.text}</h1>
                    <em className='font-hairline text-xs'>{props.subtext}</em>
                </div>
                <div className="flex flex-row items-center w-1/2">
                    <h1 className="text-3xl font-bold" style={{color:'#2980b9',marginLeft:'auto'}}>{props.value}</h1>
                    {props.children}
                </div>
            </div>
            <div className='mt-3' style={{backgroundColor:'grey'}}>
                <LinearProgress variant="determinate" value={props.progress} />
            </div>
        </div>
    )
}