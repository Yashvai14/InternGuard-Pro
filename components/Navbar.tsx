import React from 'react'

const Navbar = () => {
  return (
    <div className='flex justify-between items-center p-4 rounded-full mt-8 bg-gray-600 text-white w-300 mx-auto'>
        <h1 className="text-xl font-bold">InternGuard</h1>
        <nav>
            <ul className="flex space-x-4">
                <li><a href="#problem">Detection</a></li>
                <li><a href="#how-it-works">About</a></li>
                <li><a href="#how-it-works">Results</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#trust">Community</a></li>
            </ul>
        </nav>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">Login</button>
    </div>
  )
}

export default Navbar