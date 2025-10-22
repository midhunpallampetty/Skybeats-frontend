"use client"
import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Cookies from "js-cookie"
import { useRouter } from "next/router"
import axiosInstance from "@/pages/api/utils/axiosInstance"
import { Box, CheckCircle, Clock, Package } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"

const AllCargoRequests = () => {
  const Navbar = dynamic(() => import("../../../Components/Navbar"), { ssr: false })
  const [cargoRequests, setCargoRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const userId = Cookies.get("userId")
  const router = useRouter()

  useEffect(() => {
    const fetchCargoRequests = async () => {
      try {
        const response = await axiosInstance.post("/getCargoBookings", {
          userId,
          header: {
            "Content-Type": "application/json",
          },
        })

        setCargoRequests(response.data.data || [])
      } catch (error) {
        console.error("Error fetching cargo requests:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchCargoRequests()
    }
  }, [userId])

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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
  }

  const filteredRequests = cargoRequests.filter(request => {
    const { packageName, receiverName, descriptionOfGoods, trackingId } = request
    const query = searchQuery.toLowerCase()
    return [
      packageName?.toLowerCase()?.includes(query),
      receiverName?.toLowerCase()?.includes(query),
      descriptionOfGoods?.toLowerCase()?.includes(query),
      trackingId?.toLowerCase()?.includes(query)
    ].some(Boolean)
  })

  const StatusBadge = ({ approved, rejected }) => {
    if (approved) {
      return (
        <motion.div
          className="flex items-center bg-green-600 text-white text-xs px-2 py-1 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 500 }}
        >
          <CheckCircle className="w-3 h-3 mr-1" /> Approved
        </motion.div>
      )
    } else if (rejected) {
      return (
        <motion.div
          className="flex items-center bg-red-600 text-white text-xs px-2 py-1 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 500 }}
        >
          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>{" "}
          Rejected
        </motion.div>
      )
    } else {
      return (
        <motion.div
          className="flex items-center bg-amber-500 text-white text-xs px-2 py-1 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 500 }}
        >
          <Clock className="w-3 h-3 mr-1" /> Pending
        </motion.div>
      )
    }
  }

  return (
    <>
      <Navbar />
      <div className="w-full min-h-screen bg-[#050A18] pt-20 pb-10">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="flex justify-between items-center mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="w-full max-w-md">
              <motion.input
                type="text"
                placeholder="Search cargo requests..."
                className="w-full bg-[#0F1A36] border border-[#1E2A4A] rounded-lg px-4 py-2 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                whileFocus={{ scale: 1.02, borderColor: "#3B82F6" }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <motion.button
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Package className="w-5 h-5 mr-2" />
              Cargo Requests
            </motion.button>
          </motion.div>

          <motion.div
            className="relative w-full h-36 rounded-xl overflow-hidden mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <img
              src="https://images3.alphacoders.com/135/1350069.jpeg"
              alt="Cargo Shipments Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F1A36]/80 to-transparent flex flex-col justify-center px-8">
              <motion.h1
                className="text-2xl font-bold text-white mb-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                Your Cargo Shipments
              </motion.h1>
              <motion.p
                className="text-white/80 text-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                Track and manage all your cargo requests in one place
              </motion.p>
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            <motion.div
              className="bg-blue-600 rounded-xl p-4 flex justify-between items-center"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
              }}
            >
              <div>
                <p className="text-white/80 text-sm">Total Shipments</p>
                <p className="text-white text-2xl font-bold">{loading ? "-" : filteredRequests.length}</p>
              </div>
              <motion.div
                className="bg-blue-500/50 p-3 rounded-lg"
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Box className="w-6 h-6 text-white" />
              </motion.div>
            </motion.div>

            <motion.div
              className="bg-green-600 rounded-xl p-4 flex justify-between items-center"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
              }}
            >
              <div>
                <p className="text-white/80 text-sm">Approved</p>
                <p className="text-white text-2xl font-bold">
                  {loading ? "-" : filteredRequests.filter(req => req.approved).length}
                </p>
              </div>
              <motion.div
                className="bg-green-500/50 p-3 rounded-lg"
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <CheckCircle className="w-6 h-6 text-white" />
              </motion.div>
            </motion.div>

            <motion.div
              className="bg-amber-500 rounded-xl p-4 flex justify-between items-center"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
              }}
            >
              <div>
                <p className="text-white/80 text-sm">Pending Approval</p>
                <p className="text-white text-2xl font-bold">
                  {loading ? "-" : filteredRequests.filter(req => !req.approved && !req.rejected).length}
                </p>
              </div>
              <motion.div
                className="bg-amber-400/50 p-3 rounded-lg"
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Clock className="w-6 h-6 text-white" />
              </motion.div>
            </motion.div>
          </motion.div>

          <div className="mb-6">
            <div className="flex items-center mb-4">
              <Package className="w-5 h-5 text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold text-white">Cargo Requests</h2>
            </div>

            {loading ? (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                {Array.from({ length: 4 }).map((_, index) => (
                  <motion.div
                    key={index}
                    className="bg-[#0F1A36] border border-[#1E2A4A] rounded-xl p-4 animate-pulse"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
                    }}
                  >
                    <div className="flex items-start">
                      <div className="bg-[#1E2A4A] w-16 h-16 rounded-lg mr-4"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-[#1E2A4A] rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-[#1E2A4A] rounded w-1/2 mb-4"></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-4 bg-[#1E2A4A] rounded w-full"></div>
                          <div className="h-4 bg-[#1E2A4A] rounded w-full"></div>
                          <div className="h-4 bg-[#1E2A4A] rounded w-full"></div>
                          <div className="h-4 bg-[#1E2A4A] rounded w-full"></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : filteredRequests.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                <AnimatePresence>
                  {filteredRequests.map((request, index) => (
                    <motion.div
                      key={request.id || index}
                      className="bg-[#0F1A36] border border-[#1E2A4A] rounded-xl p-4"
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
                      }}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      layout
                    >
                      <div className="flex items-start">
                        <motion.div
                          className="bg-[#1E2A4A] p-4 rounded-lg mr-4"
                          whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                        >
                          <Box className="w-8 h-8 text-blue-500" />
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-white font-semibold">
                              {request.packageName || "Unnamed Package"}
                            </h3>
                            <StatusBadge approved={request.approved} rejected={request.rejected} />
                          </div>
                          <p className="text-white/60 text-sm mb-3">To: {request.receiverName}</p>

                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <div>
                              <p className="text-white/60">Description:</p>
                              <p className="text-white truncate">
                                {request.descriptionOfGoods || "No description"}
                              </p>
                            </div>
                            <div>
                              <p className="text-white/60">Tracking ID:</p>
                              <p className="text-white font-mono">{request.trackingId}</p>
                            </div>
                            <div>
                              <p className="text-white/60">Date:</p>
                              <p className="text-white">{formatDate(request.Date_Received)}</p>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end">
                            <motion.button
                              className="flex items-center bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1 rounded-lg"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Track
                              <motion.svg
                                className="w-4 h-4 ml-1"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                initial={{ x: 0 }}
                                whileHover={{ x: 3 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                <path
                                  d="M9 18L15 12L9 6"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </motion.svg>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                className="bg-[#0F1A36] border border-[#1E2A4A] rounded-xl p-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  <Package className="w-12 h-12 text-blue-500/50 mx-auto mb-4" />
                </motion.div>
                <motion.p
                  className="text-white text-lg font-medium mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  No cargo requests found
                </motion.p>
                <motion.p
                  className="text-white/60 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  You haven't made any cargo requests yet.
                </motion.p>
                <motion.button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create New Request
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default AllCargoRequests