import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LoginPage from './LoginPage'
import SignUpPage from './SignUpPage'
import DashboardPage from './DashboardPage'
import SearchPage from './SearchPage'
import SearchResultsPage from './SearchResultsPage'
import DesignerDetailPage from './DesignerDetailPage'
import DogRegistrationPage from './DogRegistrationPage'
import DogRegistrationSuccessPage from './DogRegistrationSuccessPage'
import QuoteRequestSuccessPage from './QuoteRequestSuccessPage'
import QuoteRequestPage from './QuoteRequestPage'
import DogInfoPage from './DogInfoPage'
import QuoteDetailPage from './QuoteDetailPage'
import QuoteAlertPage from './QuoteAlertPage'
import ChatPage from './ChatPage'
import ChatConversationPage from './ChatConversationPage'
import MyPageGroomingPage from './MyPageGroomingPage'
import MyPageAccountPage from './MyPageAccountPage'
import DesignerDetailVariantPage from './DesignerDetailVariantPage'
import CalendarPage from './CalendarPage'
import MyPage from './MyPage'
import DesignerListPage from './DesignerListPage'
import ReviewPage from './ReviewPage'
import ChatVariant1Page from './ChatVariant1Page'
import DogDetailVariantPage from './DogDetailVariantPage'
import NotificationPage from './NotificationPage'
import FavoritesPage from './FavoritesPage'
import HelpPage from './HelpPage'
import DashboardVariantRealPage from './DashboardVariantRealPage'
import DesignerGalleryPage from './DesignerGalleryPage'
import DesignerReviewsPage from './DesignerReviewsPage'
import PaymentPage from './PaymentPage'
import BookingConfirmationPage from './BookingConfirmationPage'
import DogEditPage from './DogEditPage'
import DogGroomEditPage from './DogGroomEditPage'
import LocationSelectPage from './LocationSelectPage'
// Designer Pages
import DesignerLoginPage from './DesignerLoginPage'
import DesignerDashboard from './DesignerDashboard'
import DesignerQuotesPage from './DesignerQuotesPage'
import DesignerReservationsPage from './DesignerReservationsPage'
import DesignerPortfolioPage from './DesignerPortfolioPage'
import DesignerMessagesPage from './DesignerMessagesPage'
import DesignerAnalyticsPage from './DesignerAnalyticsPage'
import DesignerProfilePage from './DesignerProfilePage'
import DesignerSchedulePage from './DesignerSchedulePage'
import DesignerQuoteCheckPage from './DesignerQuoteCheckPage'
import DesignerChatConversationPage from './DesignerChatConversationPage'
import DesignerSendQuotePage from './DesignerSendQuotePage'
import DesignerAnnouncementsPage from './DesignerAnnouncementsPage'
import DesignerSupportPage from './DesignerSupportPage'
import './App.css'

function App() {
  return (
    <div className="app-root">
      <Router>
        <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/search-results" element={<SearchResultsPage />} />
        <Route path="/designer" element={<DesignerDetailPage />} />
        <Route path="/designer-variant" element={<DesignerDetailVariantPage />} />
        <Route path="/dog-registration" element={<DogRegistrationPage />} />
        <Route path="/dog-registration-complete" element={<DogRegistrationSuccessPage />} />
        <Route path="/dog-info" element={<DogInfoPage />} />
        <Route path="/quote-request" element={<QuoteRequestPage />} />
        <Route path="/quote-request-success" element={<QuoteRequestSuccessPage />} />
        <Route path="/quote-detail" element={<QuoteDetailPage />} />
        <Route path="/quote-alerts" element={<QuoteAlertPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:roomId" element={<ChatConversationPage />} />
        <Route path="/mypage-grooming" element={<MyPageGroomingPage />} />
        <Route path="/mypage-account" element={<MyPageAccountPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/designer-list" element={<DesignerListPage />} />
        <Route path="/designers" element={<DesignerListPage />} />
        <Route path="/write-review" element={<ReviewPage />} />
        <Route path="/chat-messages" element={<ChatVariant1Page />} />
        <Route path="/dog-detail" element={<DogDetailVariantPage />} />
        <Route path="/notification" element={<NotificationPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/dashboard-real" element={<DashboardVariantRealPage />} />
        <Route path="/designer-gallery" element={<DesignerGalleryPage />} />
        <Route path="/designer-reviews" element={<DesignerReviewsPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
        <Route path="/dog-edit" element={<DogEditPage />} />
        <Route path="/dog-groom-edit" element={<DogGroomEditPage />} />
        <Route path="/location-select" element={<LocationSelectPage />} />

        {/* Designer Routes */}
        <Route path="/designer-login" element={<DesignerLoginPage />} />
        <Route path="/designer-dashboard" element={<DesignerDashboard />} />
        <Route path="/designer-quotes" element={<DesignerQuotesPage />} />
        <Route path="/designer-quotes-check" element={<DesignerQuoteCheckPage />} />
        <Route path="/designer-send-quote/:quoteId" element={<DesignerSendQuotePage />} />
          <Route path="/designer-chat/:roomId" element={<DesignerChatConversationPage />} />
        <Route path="/designer-reservations" element={<DesignerReservationsPage />} />
        <Route path="/designer-portfolio" element={<DesignerPortfolioPage />} />
        <Route path="/designer-messages" element={<DesignerMessagesPage />} />
        <Route path="/designer-analytics" element={<DesignerAnalyticsPage />} />
        <Route path="/designer-profile" element={<DesignerProfilePage />} />
        <Route path="/designer-schedule" element={<DesignerSchedulePage />} />
        <Route path="/designer-announcements" element={<DesignerAnnouncementsPage />} />
        <Route path="/designer-support" element={<DesignerSupportPage />} />
      </Routes>
    </Router>
    </div>
  )
}

export default App
