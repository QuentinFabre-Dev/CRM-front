import React from 'react'
import Divider from '@material-ui/core/Divider';

import CommercialInfo from '../components/commercial/commercial_info'
import CommercialEtu from '../components/commercial_etu/commercial_etu'
import CommercialCardStat from '../components/commercial/commercial_card_stat'
import CommercialCardAction from '../components/commercial/commercial_card_action'

import DesktopMacIcon from '@material-ui/icons/DesktopMac';
import EqualizerIcon from '@material-ui/icons/Equalizer';
import PhoneIphoneIcon from '@material-ui/icons/PhoneIphone';
import BusinessIcon from '@material-ui/icons/Business';
import TouchAppIcon from '@material-ui/icons/TouchApp';

import '../scss/Commercial.css'

export default function Commercial() {
    return(
        <div className="app__commercial">
                <section className='flex flex-row justify-between w-full'>
                    <CommercialInfo text="Chiffre d'affaire signé" value='12 500€' pourcent={65} color="card_darkblue" />
                    <CommercialInfo text="Chiffre d’affaire facturé" value='17 900€' pourcent={75} color="card_blue" />
                    <CommercialInfo text="Chiffre d’affaire encaissé" value='12 500€' pourcent={85} color="card_orange" />
                    <CommercialInfo text="Evolution du CA" value='12 500€' pourcent={75} color="card_green"/>
                </section>
                <Divider variant="middle" style={{marginTop:30}} />
                
            <div className='flex flex-row'>
                <section className='flex flex-col' style={{width:'73%'}}>
                    <CommercialEtu data='etu'/>
                    <CommercialEtu data='pc'/>
                </section>
                
                <section className='ml-24 content-start justify-between flex flex-row flex-wrap' style={{width:'20%'}}>
                    <CommercialCardStat text='16 Études' size='100' color='pink'> 
                        <EqualizerIcon style={{ color: "#FF1F5A",fontSize: '3rem'}} />
                    </CommercialCardStat>

                    <CommercialCardStat text='16 Études' size='45' color='green'> 
                        <PhoneIphoneIcon style={{ color: "#21E6C1",fontSize: '2rem',marginBottom:15}} />
                    </CommercialCardStat>
                    <CommercialCardStat text='16 Études' size='45' color='blue'> 
                        <DesktopMacIcon style={{ color: "#278EA5",fontSize: '2rem',marginBottom:15}} />
                    </CommercialCardStat>
                    <CommercialCardStat text='16 Études' size='45' color='darkblue'> 
                        <BusinessIcon style={{ color: "#1F4287",fontSize: '2rem',marginBottom:15}} />
                    </CommercialCardStat>
                    <CommercialCardStat text='16 Études' size='45' color='dark'> 
                        <TouchAppIcon style={{ color: "#071E3D",fontSize: '2rem',marginBottom:15}} />
                    </CommercialCardStat>

                    <CommercialCardAction />
                    <CommercialCardAction />
                </section>
            </div>

        </div>
    )
}
