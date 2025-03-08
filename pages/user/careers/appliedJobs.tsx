import { useEffect, useState, useRef } from "react"
import { FileText, Mail, Phone, Calendar, Search, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react"
import dynamic from "next/dynamic"
import Cookies from "js-cookie"
import axiosInstance from "@/pages/api/utils/axiosInstance"
import { useRouter } from "next/router"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"

interface JobApplication {
  id: string
  name: string
  email: string
  phone: string
  coverLetter: string
  cv: string
  Date: string
  createdAt: string
  jobTitle?: string
}

const pageSize = 3
const Navbar = dynamic(() => import("../../components/Navbar"))

export default function AppliedJobs() {
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<"Date" | "createdAt">("Date")
  const [sortedApplications, setSortedApplications] = useState<JobApplication[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const hasFetched = useRef(false)
  const userId = Cookies.get("userId")
  const accessToken = Cookies.get("accessToken")
  const refreshToken = Cookies.get("refreshToken")

  useEffect(() => {
    if (!userId || !accessToken || !refreshToken) {
      Cookies.remove("userId")
      Cookies.remove("accessToken")
      Cookies.remove("refreshToken")
      router.push("/")
    }
  }, [router, accessToken, refreshToken, userId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        const response = await axiosInstance.post("/getApplied", { userId })
        const jobsWithTitles = response.data.map((job: JobApplication) => ({
          ...job,
          jobTitle: job.name,
        }))
        setJobApplications(jobsWithTitles)
      } catch (error) {
        console.error("Error fetching job applications:", error)
      }
    }

    if (userId && !hasFetched.current) {
      hasFetched.current = true
      fetchAppliedJobs()
    }
  }, [userId])

  const getRandomJobTitle = () => {
    const titles = ["UX Researcher", "Frontend Developer", "Product Designer", "UI Designer", "Full Stack Developer"]
    return titles[Math.floor(Math.random() * titles.length)]
  }

  useEffect(() => {
    const filteredData = jobApplications.filter(
      (job) =>
        job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.jobTitle && job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        job.email.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const sortedData = [...filteredData].sort((a, b) => {
      return sortField === "Date"
        ? new Date(b.Date).getTime() - new Date(a.Date).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    setSortedApplications(sortedData)
  }, [jobApplications, sortField, searchQuery])

  const totalPages = Math.ceil(sortedApplications.length / pageSize)
  const paginatedApplications = sortedApplications.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleSortChange = (field: "Date" | "createdAt") => setSortField(field)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
    hover: {
      y: -5,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  }

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  }

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-[#0e0e22] text-white">
        <motion.div
          className="container mx-auto mt-10 py-10 px-4 "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="text-center mb-10"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-block"
            >
              <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-3 inline-block">
                Your Applications
              </span>
            </motion.div>
            <motion.h1
              className="text-4xl font-bold text-[#8bc34a] mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Applied Jobs
            </motion.h1>
            <motion.p
              className="text-[#26c6da]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Track and manage all your job applications in one place.
            </motion.p>
          </motion.div>

          <motion.div
            className="flex flex-col md:flex-row items-center justify-between mb-8 bg-[#191944] rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="relative w-full md:w-auto mb-4 md:mb-0 flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <motion.input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0f0f2f] text-white rounded-lg outline-none border border-gray-700 focus:border-[#26c6da]"
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              />
            </div>

            <div className="flex items-center">
              <SlidersHorizontal className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-300 mr-2 text-sm">Sort By:</span>
              <motion.select
                value={sortField}
                onChange={(e) => handleSortChange(e.target.value as "Date" | "createdAt")}
                className="px-3 py-2 rounded-2xl bg-blue-950 text-white border border-gray-700 focus:border-[#26c6da] outline-none text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <option value="Date">Application Date</option>
                <option value="createdAt">Created At</option>
              </motion.select>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`page-${currentPage}-${searchQuery}-${sortField}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 gap-6"
            >
              <LayoutGroup>
                {paginatedApplications.length > 0 ? (
                  paginatedApplications.map((job, index) => (
                    <motion.div
                      key={job.id}
                      variants={cardVariants}
                      whileHover="hover"
                      layout
                      className="bg-[#101032] rounded-2xl overflow-hidden shadow-lg border border-gray-800"
                    >
                      <div className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <motion.div
                            className="mb-3 md:mb-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <h2 className="text-xl font-bold text-[#8bc34a]">{job.jobTitle}</h2>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 * index }}
                            className="flex items-center"
                          >
                            <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                              {formatDate(job.Date)}
                            </span>
                          </motion.div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <motion.div
                            className="flex items-center gap-2 text-sm text-[#26c6da]"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 * index }}
                          >
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{job.email}</span>
                          </motion.div>
                          <motion.div
                            className="flex items-center gap-2 text-sm text-[#26c6da]"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 * index }}
                          >
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{job.phone}</span>
                          </motion.div>
                        </div>

                        <motion.div
                          className="mb-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 * index }}
                        >
                          <h3 className="text-[#8bc34a] font-semibold mb-2">Cover Letter</h3>
                          <p className="text-gray-300 text-sm line-clamp-3">{job.coverLetter}</p>
                        </motion.div>

                        <motion.div
                          className="flex justify-end"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 * index }}
                        >
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            className="px-4 py-2 bg-[#8bc34a] text-white rounded-lg flex items-center gap-2 text-sm font-medium"
                            onClick={() => window.open(job.cv, '_blank')}
                          >
                            <FileText className="h-4 w-4" />
                            View CV
                          </motion.button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-16 bg-[#2a2a30] rounded-lg"
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    </motion.div>
                    <h2 className="text-xl font-semibold text-[#8bc34a] mb-2">No Applications Found</h2>
                    <p className="text-sm text-[#26c6da]">It looks like there are no job applications at the moment.</p>
                  </motion.div>
                )}
              </LayoutGroup>
            </motion.div>
          </AnimatePresence>

          {sortedApplications.length > 0 && (
            <motion.div
              className="flex justify-center items-center mt-8 space-x-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <motion.button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-full bg-[#2a2a30] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>

              <span className="px-4 py-2 rounded-full bg-[#2a2a30] text-white text-sm">
                Page {currentPage} of {totalPages}
              </span>

              <motion.button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-full bg-[#2a2a30] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  )
}