"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import Cookies from "js-cookie"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/redux/store"
import { setSeats } from "@/redux/slices/seatSlice"
import { useRouter } from "next/router"
import { setAircraftModel } from "@/redux/slices/aircraftModelSlice"
import { setSelectedSeat, clearSpecificSeat,clearSelectedSeat } from "@/redux/slices/selectedSeat"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Plane, Info } from "lucide-react"
import axiosInstance from "@/pages/api/utils/axiosInstance"

// Moved Navbar dynamic import outside the component to prevent re-rendering
const Navbar = dynamic(() => import("../../../Components/Navbar"), { 
  ssr: false,
  loading: () => <div className="h-16 bg-[#050A18]"></div> // Add loading placeholder
})

const SelectSeats: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const passengerCount = useSelector((state: RootState) => state.passengerCount.selectedPassenger)
  const seats = useSelector((state: RootState) => state.seats.seats)
  const [aircraftModel, setAircraftModelLocal] = useState("")
  const selectedFlight = useSelector((state: RootState) => state.bookdetail.selectedFlight)
  
  const [localSelectedSeats, setLocalSelectedSeats] = useState<any[]>([])
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null)

  const totalPassengers =
    (passengerCount?.adults || 0) +
    (passengerCount?.seniors || 0) +
    (passengerCount?.children || 0) +
    (passengerCount?.infants || 0)

  // Authentication check
  useEffect(() => {
    const userId = Cookies.get("userId")
    const accessToken = Cookies.get("accessToken")
    const refreshToken = Cookies.get("refreshToken")

    if (!userId || !accessToken || !refreshToken) {
      Cookies.remove("userId")
      Cookies.remove("accessToken")
      Cookies.remove("refreshToken")
      router.push("/")
    }
  }, [router])

  // Initial loading effect
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000)
  }, [])

  // Fetch aircraft model
  useEffect(() => {
    const fetchAircraftModel = async () => {
      try {
        const response: any = await axiosInstance.post("/airRadar", {
          flightNumber: selectedFlight?.flightNumber,
          airline: selectedFlight?.airline,
        })
        const model = response.data?.aircraftDetails[0] || ""
        setAircraftModelLocal(model)
        if (model) dispatch(setAircraftModel(model))
      } catch (error) {
        console.error("Failed to fetch aircraft model:", error)
      }
    }

    if (selectedFlight?.flightNumber) {
      fetchAircraftModel()
    }
  }, [selectedFlight?.flightNumber, selectedFlight?.airline, dispatch])

  // Fetch seats
  useEffect(() => {
    const fetchSeats = async () => {
      if (!aircraftModel) return

      try {
        const response = await axiosInstance.post("/getSeats", {
          flightNumber: selectedFlight?.flightNumber,
          flightModel: aircraftModel,
        })
        dispatch(setSeats(response.data || []))
      } catch (error: any) {
        console.error("Error fetching seats:", error.message)
      }
    }

    if (aircraftModel && selectedFlight?.flightNumber) {
      fetchSeats()
    }
  }, [dispatch, aircraftModel, selectedFlight?.flightNumber])

  const getPriceByClass = (seatClass: string) => {
    switch (seatClass) {
      case "Business Class":
        return 1099
      case "First Class":
        return 899
      default:
        return 499
    }
  }
  const handleContinueWithSkipSeat = async () => {
    try {
        // Clear local and Redux state before beginning
        setLocalSelectedSeats([]); // Clear local state
        dispatch(clearSelectedSeat()); // Clear Redux state (you need a Redux action for this)

        const randomSeats = [];

        // Fetch random seat for each passenger
        for (let i = 0; i < totalPassengers; i++) {
            const response = await axiosInstance.post('/getRandomSeat', {
                flightModel: aircraftModel,
            });

            const randomSeat = response.data;

            console.log(response, 'Fetched random seat');

            // Check if the random seat is valid
            if (!randomSeat || !randomSeat.seatId) {
                toast.error(
                    'No available seats found for some passengers. Please try selecting manually.',
                    {
                        position: "top-center",
                        autoClose: 3000,
                        hideProgressBar: true,
                    }
                );
                return;
            }

            // Add price to seat details
            const seatWithPrice = {
                ...randomSeat,
                _id: randomSeat.seatId, // Ensure `_id` is included for Redux compatibility
                price: getPriceByClass(randomSeat.class),
            };

            randomSeats.push(seatWithPrice);
        }

        // Update local and Redux state with new seats
        setLocalSelectedSeats(randomSeats); // Update local state
        randomSeats.forEach(seat => {
            dispatch(setSelectedSeat(seat)); // Add to Redux
        });

        console.log('Updated Redux state with random seats:', randomSeats);

        // Navigate to booking details page if all random seats are successfully assigned
        router.push('/user/flight/bookingdetails');
    } catch (error) {
        console.error('Error fetching random seats:', error);
        toast.error('Error fetching random seats. Please try again.', {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
        });
    }
};
  const handleSeatClick = async (seat: any) => {
    const aircraftId = `${selectedFlight?.flightNumber}-${selectedFlight?.airline}`

    try {
      const response = await axiosInstance.post("/checkSeat", {
        holdSeatId: seat._id,
        aircraftId: aircraftId,
      })

      if (response.data.isHeld) {
        toast.error(`Seat ${seat.row}${seat.col} is currently held by another passenger.`, {
          position: "top-center",
          autoClose: 3000,
        })
        return
      }

      const alreadySelected = localSelectedSeats.find((s) => s._id === seat._id)
      const seatPrice = getPriceByClass(seat.class)

      if (localSelectedSeats.length >= totalPassengers && !alreadySelected) {
        toast.error(`You can only select ${totalPassengers} seats.`, {
          position: "top-center",
          autoClose: 3000,
        })
        return
      }

      if (alreadySelected) {
        setLocalSelectedSeats((prev) => prev.filter((s) => s._id !== seat._id))
        dispatch(clearSpecificSeat(seat._id))
      } else {
        const seatWithPrice = { ...seat, price: seatPrice }
        setLocalSelectedSeats((prev) => [...prev, seatWithPrice])
        dispatch(setSelectedSeat(seatWithPrice))
      }
    } catch (error) {
      console.error("Error checking seat availability:", error)
      toast.error("Error checking seat availability. Please try again.")
    }
  }

  const getSeatColor = (seat: any) => {
    if (seat.isBooked) return "bg-gray-700"
    if (localSelectedSeats.some((s) => s._id === seat._id)) return "bg-blue-500"
    switch (seat.class) {
      case "First Class":
        return "bg-purple-900"
      case "Business Class":
        return "bg-indigo-900"
      default:
        return "bg-blue-900"
    }
  }

  return (
    <>
      <Navbar />
      <AnimatePresence>
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050A18] flex items-center justify-center z-50"
          >
            <motion.div
              animate={{
                rotate: 360,
                transition: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
              }}
              className="w-16 h-16"
            >
              <Plane className="w-16 h-16 text-blue-500" />
            </motion.div>
          </motion.div>
        ) : (
          <div className="min-h-screen bg-[#050A18] pt-20 pb-10 px-4">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Select Your Seats</h1>
                <p className="text-gray-400">
                  Choose from available seats for your flight from {selectedFlight?.departureAirport} to {selectedFlight?.arrivalAirport    }. You need to select {totalPassengers}{" "}
                  seats.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Panel - Flight Info & Selection */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
                  <div className="bg-[#0A1428] rounded-xl p-6 space-y-6">
                    <div>
                      <h2 className="text-white text-xl font-semibold mb-4 flex items-center">
                        <Info className="w-5 h-5 mr-2" />
                        Your Selection
                      </h2>
                      {localSelectedSeats.length === 0 ? (
                        <p className="text-gray-400">No seats selected yet</p>
                      ) : (
                        <div className="space-y-2">
                          {localSelectedSeats.map((seat) => (
                            <motion.div
                              key={seat._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="flex items-center justify-between bg-[#1A2438] p-3 rounded-lg"
                            >
                              <div>
                                <p className="text-white font-medium">
                                  {seat.row}
                                  {seat.col}
                                </p>
                                <p className="text-sm text-gray-400">{seat.class}</p>
                              </div>
                              <p className="text-blue-400">₹{seat.price}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h2 className="text-white text-xl font-semibold mb-4">Flight Information</h2>
                      <div className="space-y-2 text-gray-400">
                        <p>Flight: {selectedFlight?.flightNumber}</p>
                        <p>Aircraft: {aircraftModel}</p>
                        <p>Route: {selectedFlight?.departureAirport} → {selectedFlight?.arrivalAirport}</p>
                        <p>Date: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push("/user/flight/bookingdetails")}
                      disabled={localSelectedSeats.length !== totalPassengers}
                      className={`w-full py-3 rounded-lg font-medium ${
                        localSelectedSeats.length === totalPassengers
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "bg-gray-700 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      Continue
                    </motion.button>
                    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleContinueWithSkipSeat}
        className="w-full py-3 mt-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600"
      >
        Skip Seat Selection
      </motion.button>
                  </div>
                </motion.div>
                

                {/* Right Panel - Seat Map */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-9">
                  <div className="bg-[#0A1428] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-white text-xl font-semibold">Seat Map</h2>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded bg-purple-900 mr-2"></div>
                          <span className="text-gray-400 text-sm">First Class</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded bg-indigo-900 mr-2"></div>
                          <span className="text-gray-400 text-sm">Business</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded bg-blue-900 mr-2"></div>
                          <span className="text-gray-400 text-sm">Economy</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-4 max-w-3xl mx-auto">
                      {seats.map((seat, index) => (
                        <motion.div
                          key={seat._id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { delay: index * 0.02 },
                          }}
                          whileHover={{ scale: 1.1, zIndex: 10 }}
                          className="relative"
                        >
                          <motion.button
                            disabled={seat.isBooked}
                            onClick={() => handleSeatClick(seat)}
                            onHoverStart={() => setHoveredSeat(seat._id)}
                            onHoverEnd={() => setHoveredSeat(null)}
                            className={`
                              w-full aspect-square rounded-lg ${getSeatColor(seat)}
                              flex items-center justify-center
                              ${seat.isBooked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                              transition-colors duration-200
                            `}
                          >
                            <span className="text-white font-medium">
                              {seat.row}
                              {seat.col}
                            </span>
                          </motion.button>

                          <AnimatePresence>
                            {hoveredSeat === seat._id && !seat.isBooked && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 bg-white rounded-lg shadow-lg p-2 z-50"
                              >
                                <div className="text-center">
                                  <p className="font-medium text-gray-900">{seat.class}</p>
                                  <p className="text-sm text-gray-600">₹{getPriceByClass(seat.class)}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
      <ToastContainer />
    </>
  )
}

export default SelectSeats