'use client';
import React from 'react';
import Image from 'next/image';
const Footer:React.FC=()=> {
  return (
    <>
     <footer className=" bg-blue shadow-inner rounded-lg  shadow-white/25 ">
        <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
          <div className="md:flex md:justify-between">
            <div className="mb-6 md:mb-0">
              <a href="https://flowbite.com/" className="flex items-center">
                <Image src="/logo_airline.png" alt="FlowBite Logo" width={152} height={52} />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
              <div>
                <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">Resources</h2>
                <ul className="text-gray-500 dark:text-gray-400 font-medium">
                  <li className="mb-4">
                    <a href="https://flowbite.com/" className="hover:underline">Flowbite</a>
                  </li>
                  <li>
                    <a href="https://tailwindcss.com/" className="hover:underline">Tailwind CSS</a>
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">Follow us</h2>
                <ul className="text-gray-500 dark:text-gray-400 font-medium">
                  <li className="mb-4">
                    <a href="https://github.com/themesberg/flowbite" className="hover:underline ">Github</a>
                  </li>
                  <li>
                    <a href="https://discord.gg/4eeurUVvTy" className="hover:underline">Discord</a>
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">Legal</h2>
                <ul className="text-gray-500 dark:text-gray-400 font-medium">
                  <li className="mb-4">
                    <a href="#" className="hover:underline">Privacy Policy</a>
                  </li>
                  <li>
                    <a href="#" className="hover:underline">Terms &amp; Conditions</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
          <div className="sm:flex sm:items-center sm:justify-between">
            <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">© 2023 <a href="https://flowbite.com/" className="hover:underline">Flowbite™</a>. All Rights Reserved.</span>
            <div className="flex mt-4 sm:justify-center sm:mt-0">
              <a href="#" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 8 19">
                  <path fillRule="evenodd" d="M6.135 3H8V0H6.135a4.147 4.147 0 0 0-4.142 4.142V6H0v3h2v9.938h3V9h2.021l.592-3H5V3.591A.6.6 0 0 1 5.592 3h.543Z" clipRule="evenodd" />
                </svg>
                <span className="sr-only">Facebook page</span>
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 dark:hover:text-white ms-5">
                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 21 16">
                  <path d="M16.942 1.556a16.3 16.3 0 0 0-4.126-1.3 12.04 12.04 0 0 0-.529 1.1 15.175 15.175 0 0 0-4.573 0 11.585 11.585 0 0 0-.535-1.1 16.274 16.274 0 0 0-4.129 1.3A17.392 17.392 0 0 0 .182 13.218a15.785 15.785 0 0 0 4.963 2.521c.41-.564.773-1.16 1.084-1.785a10.63 10.63 0 0 1-1.706-.83c.143-.106.283-.217.418-.33a11.664 11.664 0 0 0 10.118 0c.137.113.277.224.418.33-.544.324-1.118.598-1.706.83.312.625.674 1.221 1.084 1.785a15.73 15.73 0 0 0 4.967-2.52A17.4 17.4 0 0 0 16.942 1.556ZM7 12.5V6l5 3-5 3Z" />
                </svg>
                <span className="sr-only">YouTube channel</span>
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 dark:hover:text-white ms-5">
                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 17">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 3.805 0 8.5c0 2.668 1.453 5.03 3.735 6.572-.021-.5-.004-1.102.126-1.646.14-.592.94-3.992.94-3.992s-.239-.484-.239-1.2c0-1.123.65-1.96 1.457-1.96.688 0 1.02.517 1.02 1.137 0 .693-.44 1.73-.668 2.694-.19.802.4 1.457 1.18 1.457 1.417 0 2.505-1.495 2.505-3.648 0-1.906-1.37-3.244-3.325-3.244-2.265 0-3.594 1.698-3.594 3.452 0 .69.263 1.432.593 1.835.065.08.075.15.056.23-.06.252-.194.795-.22.908-.035.148-.115.178-.265.107-1.008-.468-1.637-1.935-1.637-3.117 0-2.537 1.846-4.872 5.322-4.872 2.793 0 4.963 1.986 4.963 4.638 0 2.772-1.743 5.01-4.161 5.01-.813 0-1.577-.423-1.838-.923l-.499 1.9c-.179.705-.667 1.587-.995 2.126.754.234 1.55.362 2.383.362 5.523 0 10-3.805 10-8.5C20 3.805 15.523 0 10 0Z" clipRule="evenodd" />
                </svg>
                <span className="sr-only">Dribbble account</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    
    </>
  );
};

export default Footer;