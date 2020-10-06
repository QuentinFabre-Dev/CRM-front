import React from 'react'
import PeopleIcon from '@material-ui/icons/People';
import Divider from '@material-ui/core/Divider';
import EuroIcon from '@material-ui/icons/Euro';
import BusinessCenterIcon from '@material-ui/icons/BusinessCenter';

export default function lastAction(props) {
    return(
        <section className={'flex flex-col mt-5 py-4 bg-white justify-start  shadow px-3 py-5 rounded-lg overflow-scroll'} style={{height:'70%'}}>
            <div className='py-5'>
                <span className='flex flex-row flex-no-wrap'>
                    <PeopleIcon style={{color:'#4a5568'}} /> <p className='flex-1 ml-5 text-gray-700'>Bienvenu aux nouveaux membres !</p>  <em className='text-sm text-gray-500'>12/O1/20</em>
                </span>
                <Divider variant="middle" style={{width:'90%',marginTop:10}} />
            </div>
            <div className='py-5'>
                <span className='flex flex-row flex-no-wrap'>
                    <BusinessCenterIcon style={{color:'#4a5568'}} /> <p className='flex-1 ml-5 text-gray-700'>Nouvelle études !</p>  <em className='text-sm text-gray-500'>12/O1/20</em>
                </span>
                <Divider variant="middle" style={{width:'90%',marginTop:10}} />
            </div>
            <div className='py-5'>
                <span className='flex flex-row flex-no-wrap'>
                    <EuroIcon style={{color:'#4a5568'}} /> <p className='flex-1 ml-5 text-gray-700'>Palier du CA check</p>  <em className='text-sm text-gray-500'>12/O1/20</em>
                </span>
                <Divider variant="middle" style={{width:'90%',marginTop:10}} />
            </div>
            
            
        </section>
    )
}