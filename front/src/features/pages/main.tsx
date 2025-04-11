import { LeftPanel } from './NavBar'
import { MainContent } from './MainContent'


  export const MainPage = ()=>{
    return (
        <div>
            <div className="flex flex-row w-screen h-screen">
                <div className="w-1/4 h-full bg-white border-r-2 border-gray-300">
                    <LeftPanel />
                </div>
                <div className="w-3/4 h-full bg-gray-100">
                    <MainContent />
                </div>
            </div>
        </div>
    )
}
