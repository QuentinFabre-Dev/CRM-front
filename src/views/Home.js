import React from 'react'
import AlertInfo from '../components/alert_info'
import CardInfo from '../components/card_info'
import CardAxe from '../components/card_axe'
import Timeline from '../components/timeline'
import FindPeople from '../components/findPeople'
import CardNews from '../components/cardNews'
import LastAction from '../components/lastAction'

import EuroIcon from '@material-ui/icons/Euro';
import EqualizerIcon from '@material-ui/icons/Equalizer';
import SentimentVerySatisfiedOutlinedIcon from '@material-ui/icons/SentimentVerySatisfiedOutlined';
import BusinessCenterIcon from '@material-ui/icons/BusinessCenter';
import PeopleIcon from '@material-ui/icons/People';

import '../scss/Home.css'

function Home() {
    return(
        <div className="app__home">
            <AlertInfo />
            {/* Information sur le CA, les études et le motivomètres */}
            <div className='w-full flex flex-row justify-between'>
                <CardInfo text="Chiffre d'affaire" subtext='Prévisionnel' value='15 240' progress={75}> 
                    <EuroIcon style={{ color: "#2980b9",fontSize: '2rem',marginLeft:13}} />
                </CardInfo>
                <CardInfo text="Etude en cours" subtext='Nombre étude' value='5' progress={15}> 
                    <EqualizerIcon style={{ color: "#2980b9",fontSize: '2rem',marginLeft:13}} />
                </CardInfo>
                <CardInfo text="Motivomètre" subtext='Membre de la JE' value='' progress={55}> 
                    <SentimentVerySatisfiedOutlinedIcon style={{ color: "#2980b9",fontSize: '2rem',marginLeft:13}} />
                </CardInfo>
            </div>
            
            <div className='flex flex-row w-full flex-wrap'>

                {/* Section sur les différents axes  */}
                <section className='flex self-start flex-wrap justify-between flex-row' style={{width:'65%'}} >
                    <div className='flex justify-between mt-5 px-5 flex-row' style={{width:'47%'}}>
                        <CardAxe text="Commercial" gradient='from-teal-400 to-blue-500' link='commercial'>
                            <BusinessCenterIcon/>
                        </CardAxe>
                        <CardAxe text="Trésorie" gradient='from-indigo-400 to-purple-800' link='commercial'>
                            <EuroIcon/>
                        </CardAxe>
                    </div>
                    <div className='flex justify-between mt-5 px-5 flex-row' style={{width:'47%'}}>
                        <CardAxe text="RH" gradient='from-purple-400 via-pink-500 to-red-500' link='commercial'>
                            <PeopleIcon/>
                        </CardAxe>
                        <CardAxe text="Stratégie" gradient='from-blue-300 to-blue-500' link='commercial'>
                            <EqualizerIcon/>
                        </CardAxe>
                    </div>
                    <div className=' mt-5 px-5 py-5 bg-white shadow rounded-lg' style={{width:'45%',height:400}}>
                        <FindPeople />
                    </div>

                    <div className='px-5 py-5 rounded-lg' style={{width:'45%',height:400}}>
                        <CardNews />
                        <LastAction />
                    </div>

                </section>

                {/* Timeline */}
                <div className='flex mt-5 flex-col bg-white shadow rounded-lg' style={{height:500,width:'30%',marginLeft:'5%'}}>
                    <Timeline />
                </div>
            </div>
            
        </div>
    )
}

export default Home;