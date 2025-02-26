import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  CalendarIcon,
  BedDouble,
  User,
  Phone,
  Mail,
  IndianRupee,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate, useParams } from "react-router-dom";
import RazorPayPayment from "@/components/RazorPayPayment";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import api from "@/api";
import { useAuth } from "@/context/AuthContext";

export default function HostelBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptId, setReceiptId] = useState("");
  const [roomTypes, setRoomTypes] = useState([]);
  const [bookingSummary, setBookingSummary] = useState({
    roomType: "",
    monthlyRent: 0,
    securityDeposit: 0,
    numberOfMonths: 0,
    totalAmount: 0,
  });
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    roomSelection: "",
    name: "",
    email: "",
    phone: "",
    gender: "",
    amount: "",
  });
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    // Prefill user data from auth context
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);
  
  useEffect(() => {
    const fetchHostelData = async () => {
      try {
        const hostelData = await api.get(`/api/hostel/${id}`);
        setRoomTypes(hostelData.data.roomTypes);
      } catch (error) {
        console.error("Error fetching hostel data:", error);
        toast({
          title: "Error fetching hostel data",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    };
    fetchHostelData();
  }, [id, toast]);
  
  // Calculate number of months between dates
  useEffect(() => {
    if (formData.checkIn && formData.checkOut && formData.roomSelection) {
      calculateBookingSummary();
    }
  }, [formData.checkIn, formData.checkOut, formData.roomSelection]);

  const calculateBookingSummary = () => {
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return;
    
    // Calculate months difference (including partial months)
    const months = (checkOut.getFullYear() - checkIn.getFullYear()) * 12 + 
                  (checkOut.getMonth() - checkIn.getMonth());
    
    // Add days as fraction of month if there are remaining days
    const daysInMonth = new Date(checkOut.getFullYear(), checkOut.getMonth() + 1, 0).getDate();
    const remainingDays = checkOut.getDate() - checkIn.getDate();
    const totalMonths = months + (remainingDays > 0 ? remainingDays / daysInMonth : 0);
    
    // Round up to nearest month (minimum 1 month)
    const roundedMonths = Math.max(1, Math.ceil(totalMonths));
    
    const selectedRoom = roomTypes.find(r => r.type === formData.roomSelection);
    
    if (selectedRoom) {
      const monthlyRent = selectedRoom.pricePerMonth;
      const securityDeposit = monthlyRent; // Security deposit equal to 1 month rent
      const totalRent = monthlyRent * roundedMonths;
      const totalAmount = totalRent + securityDeposit;
      
      setBookingSummary({
        roomType: selectedRoom.type,
        monthlyRent,
        securityDeposit,
        numberOfMonths: roundedMonths,
        totalAmount,
      });
      
      setFormData(prev => ({
        ...prev,
        amount: totalAmount,
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateDates = () => {
    const checkIn = formData.checkIn ? new Date(formData.checkIn) : null;
    const checkOut = formData.checkOut ? new Date(formData.checkOut) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!checkIn || !checkOut || isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      toast({
        title: "Missing Check-in or Check-out Date",
        variant: "destructive",
      });
      return false;
    }
    
    if (checkIn < today) {
      toast({
        title: "Invalid Check-in Date",
        description: "Check-in date cannot be in the past",
        variant: "destructive",
      });
      return false;
    }
    
    if (checkOut <= checkIn) {
      toast({
        title: "Invalid Check-out Date",
        description: "Check-out date must be after check-in date",
        variant: "destructive",
      });
      return false;
    }
    
    // Ensure minimum 1 month stay
    const oneMonthLater = new Date(checkIn);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    if (checkOut < oneMonthLater) {
      toast({
        title: "Minimum Stay Required",
        description: "Booking must be for at least 1 month",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const validatePhone = () => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.email?.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!validatePhone()) return false;
    
    if (!formData.gender) {
      toast({
        title: "Select Gender",
        description: "Please select your gender.",
        variant: "destructive",
      });
      return false;
    }
  
    
    if (!formData.roomSelection) {
      toast({
        title: "Select a Room",
        description: "Please select a room type.",
        variant: "destructive",
      });
      return false;
    }
    
    const selectedRoom = roomTypes.find(r => r.type === formData.roomSelection);
    if (!selectedRoom) {
      toast({
        title: "Invalid Room Selection",
        description: "Please select a valid room type.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!validateDates()) return false;
    
    return true;
  };

  document.title = "Book hostel at TravelTribe";
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Header />
      </div>
      <Toaster />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Book Your Stay</h1>
            <p className="text-gray-600 mt-2">
              Fill in the details below to secure your accommodation
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <form>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      Stay Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkIn">Check-in Date</Label>
                        <div className="relative">
                          <Input
                            id="checkIn"
                            name="checkIn"
                            type="date"
                            value={formData.checkIn}
                            onChange={handleInputChange}
                            required
                            min={new Date().toISOString().split("T")[0]}
                            className="pl-10"
                            disabled={isSubmitting}
                          />
                          <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkOut">Check-out Date</Label>
                        <div className="relative">
                          <Input
                            id="checkOut"
                            name="checkOut"
                            type="date"
                            value={formData.checkOut}
                            onChange={handleInputChange}
                            required
                            min={
                              formData.checkIn
                                ? new Date(new Date(formData.checkIn).setMonth(new Date(formData.checkIn).getMonth() + 1)).toISOString().split("T")[0]
                                : new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0]
                            }
                            className="pl-10"
                            disabled={isSubmitting}
                          />
                          <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                    </div>
                    {formData.checkIn && formData.checkOut && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="text-blue-800">
                          Your booking will be for {bookingSummary.numberOfMonths} {bookingSummary.numberOfMonths === 1 ? 'month' : 'months'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BedDouble className="w-5 h-5 text-blue-500" />
                      Room Selection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      name="roomSelection"
                      value={formData.roomSelection}
                      onValueChange={(value) =>
                        handleInputChange({
                          target: { name: "roomSelection", value },
                        })
                      }
                      className="grid gap-4"
                      disabled={isSubmitting}
                    >
                      {roomTypes.map((room, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={room.type} id={`room-${index}`} />
                          <Label htmlFor={`room-${index}`}>{room.type} | ₹ {room.pricePerMonth}/month</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-500" />
                      Personal Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          name="gender"
                          value={formData.gender}
                          onValueChange={(value) =>
                            handleInputChange({
                              target: { name: "gender", value },
                            })
                          }
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="pl-10"
                            placeholder="email address"
                            disabled={isSubmitting}
                          />
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            pattern="[0-9]{10}"
                            maxLength={10}
                            className="pl-10"
                            disabled={isSubmitting}
                          />
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <RazorPayPayment
                  hostelId={id}
                  formData={formData}
                  validateForm={validateForm}
                />
              </form>
            </div>
            <div className="md:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-blue-500" />
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.roomSelection && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room Type</span>
                        <span className="font-medium">
                          {bookingSummary.roomType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Rent</span>
                        <span className="font-medium">
                          ₹{bookingSummary.monthlyRent.toLocaleString()}
                        </span>
                      </div>
                      {bookingSummary.numberOfMonths > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration</span>
                            <span className="font-medium">
                              {bookingSummary.numberOfMonths} {bookingSummary.numberOfMonths === 1 ? 'month' : 'months'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Rent</span>
                            <span className="font-medium">
                              ₹{(bookingSummary.monthlyRent * bookingSummary.numberOfMonths).toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Security Deposit</span>
                        <span className="font-medium">
                          ₹{bookingSummary.securityDeposit.toLocaleString()}
                        </span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Total Due Now</span>
                        <span>
                          ₹{bookingSummary.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Security deposit (equal to one month's rent) is refundable at the time of checkout
                      after deducting any damages.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}