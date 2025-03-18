-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 18, 2025 at 08:41 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_sinhvien`
--

-- --------------------------------------------------------

--
-- Table structure for table `cauhinh_taikhoan`
--

CREATE TABLE `cauhinh_taikhoan` (
  `id` int(11) NOT NULL,
  `taikhoan_id` int(11) NOT NULL,
  `xac_thuc_hai_yeu_to` tinyint(1) DEFAULT 0,
  `so_dien_thoai_xac_thuc` varchar(20) DEFAULT NULL,
  `email_xac_thuc` varchar(100) DEFAULT NULL,
  `khoa_tai_khoan_sau_dang_nhap_that_bai` int(11) DEFAULT 5
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dangkyhocphan`
--

CREATE TABLE `dangkyhocphan` (
  `id` int(11) NOT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `ngay_dang_ky` datetime DEFAULT current_timestamp(),
  `trang_thai` enum('Đăng ký','Đã duyệt','Hủy') DEFAULT 'Đăng ký'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dangkyhocphan`
--

INSERT INTO `dangkyhocphan` (`id`, `sinh_vien_id`, `mon_hoc_id`, `hoc_ky`, `nam_hoc`, `ngay_dang_ky`, `trang_thai`) VALUES
(9, 12, 37, 'Kỳ 2', '2024-2025', '2025-03-17 09:18:05', 'Đăng ký'),
(10, 12, 33, 'Kỳ 2', '2024-2025', '2025-03-17 14:39:05', 'Đăng ký'),
(11, 12, 34, 'Kỳ 2', '2024-2025', '2025-03-17 14:39:09', 'Đăng ký'),
(12, 8, 33, 'Kỳ 2', '2024-2025', '2025-03-17 14:40:18', 'Đăng ký'),
(13, 8, 34, 'Kỳ 2', '2024-2025', '2025-03-18 01:46:07', 'Đăng ký'),
(14, 8, 37, 'Kỳ 2', '2024-2025', '2025-03-18 01:46:49', 'Đăng ký'),
(15, 8, 36, 'Kỳ 2', '2024-2025', '2025-03-18 01:46:54', 'Đăng ký'),
(16, 12, 37, 'Kỳ 2', '2024-2025', '2025-03-18 10:00:48', 'Đã duyệt');

--
-- Triggers `dangkyhocphan`
--
DELIMITER $$
CREATE TRIGGER `limit_mon_hoc_per_hoc_ky` BEFORE INSERT ON `dangkyhocphan` FOR EACH ROW BEGIN
    DECLARE mon_count INT;
    
    -- Đếm số môn đã đăng ký trong cùng học kỳ và năm học
    SELECT COUNT(*) INTO mon_count
    FROM `dangkyhocphan`
    WHERE `sinh_vien_id` = NEW.`sinh_vien_id`
    AND `hoc_ky` = NEW.`hoc_ky`
    AND `nam_hoc` = NEW.`nam_hoc`
    AND `trang_thai` IN ('Đăng ký', 'Đã duyệt');
    
    -- Nếu vượt quá 5 môn, báo lỗi
    IF mon_count >= 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số lượng môn học tối đa là 5 môn/học kỳ';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `dethi`
--

CREATE TABLE `dethi` (
  `id` int(11) NOT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `giang_vien` varchar(50) DEFAULT NULL,
  `loai_de` enum('Giữa kỳ','Cuối kỳ','Bảo vệ') DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `thoi_gian_lam` int(11) DEFAULT NULL,
  `mo_ta` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `diemdanh`
--

CREATE TABLE `diemdanh` (
  `id` int(11) NOT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `ngay_diem_danh` date DEFAULT NULL,
  `trang_thai` enum('Có mặt','Vắng mặt','Đi muộn') DEFAULT NULL,
  `ghi_chu` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `giangvien`
--

CREATE TABLE `giangvien` (
  `id` int(11) NOT NULL,
  `ma_gv` varchar(10) NOT NULL,
  `ho_ten` varchar(100) NOT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `gioi_tinh` enum('Nam','Nữ','Khác') DEFAULT NULL,
  `dia_chi` text DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `so_dien_thoai` varchar(20) DEFAULT NULL,
  `chuyen_mon` varchar(100) DEFAULT NULL,
  `hoc_vi` varchar(50) DEFAULT NULL,
  `trang_thai` enum('Đang dạy','Nghỉ phép','Đã nghỉ việc') DEFAULT 'Đang dạy'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `giangvien`
--

INSERT INTO `giangvien` (`id`, `ma_gv`, `ho_ten`, `ngay_sinh`, `gioi_tinh`, `dia_chi`, `email`, `so_dien_thoai`, `chuyen_mon`, `hoc_vi`, `trang_thai`) VALUES
(4, 'GV003', 'Trần Văn H', '1985-08-20', 'Nam', '789 Đường DEF, Quận 7, TP.HCM', 'gv003@example.com', '0912345678', 'Công nghệ thông tin', 'Tiến sĩ', 'Đang dạy');

-- --------------------------------------------------------

--
-- Table structure for table `hocky_namhoc`
--

CREATE TABLE `hocky_namhoc` (
  `id` int(11) NOT NULL,
  `hoc_ky` varchar(20) NOT NULL,
  `nam_hoc` varchar(20) NOT NULL,
  `ngay_bat_dau` date NOT NULL,
  `ngay_ket_thuc` date NOT NULL,
  `trang_thai` enum('Hoạt động','Kết thúc') DEFAULT 'Hoạt động'
) ;

--
-- Dumping data for table `hocky_namhoc`
--

INSERT INTO `hocky_namhoc` (`id`, `hoc_ky`, `nam_hoc`, `ngay_bat_dau`, `ngay_ket_thuc`, `trang_thai`) VALUES
(3, 'Kỳ 2', '2024-2025', '2025-01-01', '2025-03-31', 'Hoạt động'),
(4, 'Kỳ 1', '2024-2025', '2024-12-01', '2025-03-01', 'Hoạt động'),
(5, 'Kỳ 2', '2024-2025', '0000-00-00', '2025-05-30', 'Hoạt động'),
(6, 'Kỳ Hè', '2024-2025', '2025-05-30', '2025-08-30', 'Hoạt động');

-- --------------------------------------------------------

--
-- Table structure for table `ketquahoctap`
--

CREATE TABLE `ketquahoctap` (
  `id` int(11) NOT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `diem_trung_binh` float DEFAULT NULL,
  `tong_tin_chi_dat` int(11) DEFAULT NULL,
  `trang_thai` enum('Đạt','Không đạt') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `khoaluandoan`
--

CREATE TABLE `khoaluandoan` (
  `id` int(11) NOT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `giang_vien_huong_dan_id` int(11) DEFAULT NULL,
  `ten_de_tai` varchar(200) NOT NULL,
  `mo_ta` text DEFAULT NULL,
  `thoi_gian_bat_dau` date DEFAULT NULL,
  `thoi_gian_ket_thuc` date DEFAULT NULL,
  `diem_so` float DEFAULT NULL,
  `trang_thai` enum('Đang thực hiện','Đã bảo vệ','Chưa hoàn thành') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lichgiangday`
--

CREATE TABLE `lichgiangday` (
  `id` int(11) NOT NULL,
  `phan_cong_id` int(11) DEFAULT NULL,
  `phong_hoc` varchar(20) DEFAULT NULL,
  `thu` enum('Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật') DEFAULT NULL,
  `tiet_bat_dau` int(11) DEFAULT NULL,
  `so_tiet` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lichhoc`
--

CREATE TABLE `lichhoc` (
  `id` int(11) NOT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `phong_hoc` varchar(20) DEFAULT NULL,
  `thu` enum('Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật') DEFAULT NULL,
  `tiet_bat_dau` int(11) DEFAULT NULL,
  `so_tiet` int(11) DEFAULT NULL,
  `loai_tiet` enum('lyThuyet','thucHanh') DEFAULT NULL,
  `buoi_hoc` enum('Sáng','Chiều','Tối') DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `so_luong_toi_da` int(11) DEFAULT 50,
  `so_luong_da_dang_ky` int(11) DEFAULT 0,
  `lich_hoc_kha_dung_id` int(11) DEFAULT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lichhoc`
--

INSERT INTO `lichhoc` (`id`, `mon_hoc_id`, `phong_hoc`, `thu`, `tiet_bat_dau`, `so_tiet`, `loai_tiet`, `buoi_hoc`, `hoc_ky`, `nam_hoc`, `so_luong_toi_da`, `so_luong_da_dang_ky`, `lich_hoc_kha_dung_id`, `sinh_vien_id`) VALUES
(1, 34, 'LT01', 'Thứ 2', 1, 2, 'lyThuyet', 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 43, 8),
(14, 37, 'LT02', 'Thứ 4', 2, 3, 'lyThuyet', 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 37, 12),
(15, 37, 'LT105', 'Thứ 7', 1, 2, 'lyThuyet', 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 67, 12),
(16, 37, 'LT104', 'Thứ 6', 1, 2, 'lyThuyet', 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 66, 12),
(17, 37, 'LT103', 'Thứ 5', 1, 2, 'lyThuyet', 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 65, 12),
(18, 37, 'LT102', 'Thứ 3', 3, 2, 'lyThuyet', 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 64, 12),
(19, 37, 'LT101', 'Thứ 2', 1, 2, 'lyThuyet', 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 53, 12),
(20, 37, 'LT104', 'Thứ 5', 9, 2, 'lyThuyet', 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 70, 12),
(21, 37, 'P.A101', 'Thứ 3', 1, 2, 'lyThuyet', 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 48, 12),
(22, 37, 'A109', 'Thứ 3', 7, 2, 'lyThuyet', 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 37, 12),
(23, 37, 'C309', 'Chủ nhật', 10, 2, 'lyThuyet', 'Tối', 'Kỳ 2', '2024-2025', 50, 0, 39, 12),
(24, 37, 'TH108', 'Thứ 7', 3, 2, 'thucHanh', 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 62, 12),
(25, 37, 'TH106', 'Thứ 6', 3, 2, 'thucHanh', 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 60, 12),
(26, 37, 'TH104', 'Thứ 5', 3, 2, 'thucHanh', 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 58, 12),
(27, 37, 'TH104', 'Thứ 7', 7, 2, 'thucHanh', 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 52, 12),
(28, 37, 'TH107', 'Thứ 6', 7, 2, 'thucHanh', 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 61, 12),
(29, 37, 'TH101', 'Thứ 2', 3, 2, 'thucHanh', 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 49, 12),
(30, 37, 'TH105', 'Thứ 5', 7, 2, 'thucHanh', 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 59, 12),
(31, 37, 'TH102', 'Thứ 2', 7, 2, 'thucHanh', 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 56, 12),
(32, 37, 'TH102', 'Thứ 4', 7, 2, 'thucHanh', 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 50, 12);

--
-- Triggers `lichhoc`
--
DELIMITER $$
CREATE TRIGGER `check_lich_hoc_trung_lap` BEFORE INSERT ON `lichhoc` FOR EACH ROW BEGIN
    DECLARE conflict_count INT;
    
    -- Kiểm tra trùng phòng học, thứ, tiết bắt đầu và buổi học
    SELECT COUNT(*) INTO conflict_count
    FROM `lichhoc`
    WHERE `phong_hoc` = NEW.`phong_hoc`
    AND `thu` = NEW.`thu`
    AND `buoi_hoc` = NEW.`buoi_hoc`
    AND (
        (NEW.`tiet_bat_dau` BETWEEN `tiet_bat_dau` AND (`tiet_bat_dau` + `so_tiet` - 1))
        OR
        ((NEW.`tiet_bat_dau` + NEW.`so_tiet` - 1) BETWEEN `tiet_bat_dau` AND (`tiet_bat_dau` + `so_tiet` - 1))
    );
    
    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Phòng học đã được sử dụng trong khung giờ này';
    END IF;
    
    -- Kiểm tra giới hạn thực hành tối đa 3 tiết/buổi
    IF NEW.`loai_tiet` = 'thucHanh' AND NEW.`so_tiet` > 3 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Số tiết thực hành tối đa là 3 tiết/buổi';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `check_so_tiet_mon_hoc` BEFORE INSERT ON `lichhoc` FOR EACH ROW BEGIN
    DECLARE tin_chi INT;
    DECLARE ly_thuyet INT;
    DECLARE thuc_hanh INT;
    
    -- Lấy số tín chỉ của môn học
    SELECT `so_tin_chi` INTO tin_chi
    FROM `monhoc`
    WHERE `id` = NEW.`mon_hoc_id`;
    
    -- Tính tổng số tiết lý thuyết và thực hành hiện tại
    SELECT COALESCE(SUM(CASE WHEN `loai_tiet` = 'lyThuyet' THEN `so_tiet` ELSE 0 END), 0),
           COALESCE(SUM(CASE WHEN `loai_tiet` = 'thucHanh' THEN `so_tiet` ELSE 0 END), 0)
    INTO ly_thuyet, thuc_hanh
    FROM `lichhoc`
    WHERE `mon_hoc_id` = NEW.`mon_hoc_id`;
    
    -- Cộng thêm số tiết mới
    IF NEW.`loai_tiet` = 'lyThuyet' THEN
        SET ly_thuyet = ly_thuyet + NEW.`so_tiet`;
    ELSEIF NEW.`loai_tiet` = 'thucHanh' THEN
        SET thuc_hanh = thuc_hanh + NEW.`so_tiet`;
    END IF;
    
    -- Kiểm tra nếu vượt quá quy định
    IF ly_thuyet > (tin_chi * 15) OR thuc_hanh > (tin_chi * 15) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tổng số tiết vượt quá quy định (1 tín chỉ = 15 tiết lý thuyết + 15 tiết thực hành)';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `lichsudangky`
--

CREATE TABLE `lichsudangky` (
  `id` int(11) NOT NULL,
  `thoi_gian` datetime NOT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `hanh_dong` varchar(50) NOT NULL,
  `ket_qua` varchar(50) NOT NULL,
  `chi_tiet` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lichsudangky`
--

INSERT INTO `lichsudangky` (`id`, `thoi_gian`, `sinh_vien_id`, `mon_hoc_id`, `hanh_dong`, `ket_qua`, `chi_tiet`) VALUES
(1, '2025-03-18 05:00:11', 12, 37, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T05:00:11.672Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(2, '2025-03-18 05:11:13', 8, 37, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T05:11:13.266Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(3, '2025-03-18 05:11:52', 8, 33, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T05:11:52.856Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(4, '2025-03-18 05:12:57', 12, 33, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T05:12:57.873Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(5, '2025-03-18 05:24:06', 12, 37, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T05:24:06.745Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(6, '2025-03-18 05:24:34', 12, 34, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T05:24:34.815Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(7, '2025-03-18 05:33:55', 12, 37, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T05:33:55.702Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(8, '2025-03-18 05:34:24', 12, 34, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T05:34:24.024Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(9, '2025-03-18 05:48:06', 12, 33, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T05:48:06.957Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(10, '2025-03-18 05:48:42', 12, 37, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T05:48:42.799Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(11, '2025-03-18 05:51:00', 12, 37, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T05:51:00.178Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(12, '2025-03-18 06:09:06', 12, 37, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T06:09:06.733Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(13, '2025-03-18 06:10:17', 8, 37, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T06:10:17.272Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(14, '2025-03-18 06:16:06', 12, 37, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T06:16:06.134Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(15, '2025-03-18 06:45:40', 12, 37, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T06:45:40.294Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(16, '2025-03-18 06:56:04', 12, 37, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T06:56:04.700Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(17, '2025-03-18 07:02:26', 12, 37, 'dangKyLichHoc', 'thatBai', '{\"thoiGianDangKy\":\"2025-03-18T07:02:26.902Z\",\"lichHocDuocChon\":null,\"loiNeuCo\":\"No available schedules found\"}'),
(18, '2025-03-18 07:15:33', 12, 37, 'dangKyLichHoc', 'thanhCong', '{\"thoiGianDangKy\":\"2025-03-18T07:15:33.935Z\",\"lichHocDuocChon\":[{\"id\":15,\"sinhVienId\":12,\"lichHocKhaDungId\":67,\"monHocId\":37,\"phongHoc\":\"LT105\",\"thu\":\"Thứ 7\",\"tietBatDau\":1,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Sáng\",\"loaiTiet\":\"lyThuyet\"},{\"id\":16,\"sinhVienId\":12,\"lichHocKhaDungId\":66,\"monHocId\":37,\"phongHoc\":\"LT104\",\"thu\":\"Thứ 6\",\"tietBatDau\":1,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Sáng\",\"loaiTiet\":\"lyThuyet\"},{\"id\":17,\"sinhVienId\":12,\"lichHocKhaDungId\":65,\"monHocId\":37,\"phongHoc\":\"LT103\",\"thu\":\"Thứ 5\",\"tietBatDau\":1,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Sáng\",\"loaiTiet\":\"lyThuyet\"},{\"id\":18,\"sinhVienId\":12,\"lichHocKhaDungId\":64,\"monHocId\":37,\"phongHoc\":\"LT102\",\"thu\":\"Thứ 3\",\"tietBatDau\":3,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Sáng\",\"loaiTiet\":\"lyThuyet\"},{\"id\":19,\"sinhVienId\":12,\"lichHocKhaDungId\":53,\"monHocId\":37,\"phongHoc\":\"LT101\",\"thu\":\"Thứ 2\",\"tietBatDau\":1,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Sáng\",\"loaiTiet\":\"lyThuyet\"},{\"id\":20,\"sinhVienId\":12,\"lichHocKhaDungId\":70,\"monHocId\":37,\"phongHoc\":\"LT104\",\"thu\":\"Thứ 5\",\"tietBatDau\":9,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Chiều\",\"loaiTiet\":\"lyThuyet\"},{\"id\":21,\"sinhVienId\":12,\"lichHocKhaDungId\":48,\"monHocId\":37,\"phongHoc\":\"P.A101\",\"thu\":\"Thứ 3\",\"tietBatDau\":1,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Sáng\",\"loaiTiet\":\"lyThuyet\"},{\"id\":22,\"sinhVienId\":12,\"lichHocKhaDungId\":37,\"monHocId\":37,\"phongHoc\":\"A109\",\"thu\":\"Thứ 3\",\"tietBatDau\":7,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Chiều\",\"loaiTiet\":\"lyThuyet\"},{\"id\":23,\"sinhVienId\":12,\"lichHocKhaDungId\":39,\"monHocId\":37,\"phongHoc\":\"C309\",\"thu\":\"Chủ nhật\",\"tietBatDau\":10,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Tối\",\"loaiTiet\":\"lyThuyet\"},{\"id\":24,\"sinhVienId\":12,\"lichHocKhaDungId\":62,\"monHocId\":37,\"phongHoc\":\"TH108\",\"thu\":\"Thứ 7\",\"tietBatDau\":3,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Sáng\",\"loaiTiet\":\"thucHanh\"},{\"id\":25,\"sinhVienId\":12,\"lichHocKhaDungId\":60,\"monHocId\":37,\"phongHoc\":\"TH106\",\"thu\":\"Thứ 6\",\"tietBatDau\":3,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Sáng\",\"loaiTiet\":\"thucHanh\"},{\"id\":26,\"sinhVienId\":12,\"lichHocKhaDungId\":58,\"monHocId\":37,\"phongHoc\":\"TH104\",\"thu\":\"Thứ 5\",\"tietBatDau\":3,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Sáng\",\"loaiTiet\":\"thucHanh\"},{\"id\":27,\"sinhVienId\":12,\"lichHocKhaDungId\":52,\"monHocId\":37,\"phongHoc\":\"TH104\",\"thu\":\"Thứ 7\",\"tietBatDau\":7,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Chiều\",\"loaiTiet\":\"thucHanh\"},{\"id\":28,\"sinhVienId\":12,\"lichHocKhaDungId\":61,\"monHocId\":37,\"phongHoc\":\"TH107\",\"thu\":\"Thứ 6\",\"tietBatDau\":7,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Chiều\",\"loaiTiet\":\"thucHanh\"},{\"id\":29,\"sinhVienId\":12,\"lichHocKhaDungId\":49,\"monHocId\":37,\"phongHoc\":\"TH101\",\"thu\":\"Thứ 2\",\"tietBatDau\":3,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Sáng\",\"loaiTiet\":\"thucHanh\"},{\"id\":30,\"sinhVienId\":12,\"lichHocKhaDungId\":59,\"monHocId\":37,\"phongHoc\":\"TH105\",\"thu\":\"Thứ 5\",\"tietBatDau\":7,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Chiều\",\"loaiTiet\":\"thucHanh\"},{\"id\":31,\"sinhVienId\":12,\"lichHocKhaDungId\":56,\"monHocId\":37,\"phongHoc\":\"TH102\",\"thu\":\"Thứ 2\",\"tietBatDau\":7,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Chiều\",\"loaiTiet\":\"thucHanh\"},{\"id\":32,\"sinhVienId\":12,\"lichHocKhaDungId\":50,\"monHocId\":37,\"phongHoc\":\"TH102\",\"thu\":\"Thứ 4\",\"tietBatDau\":7,\"soTiet\":2,\"hocKy\":\"Kỳ 2\",\"namHoc\":\"2024-2025\",\"buoiHoc\":\"Chiều\",\"loaiTiet\":\"thucHanh\"}],\"loiNeuCo\":null}');

-- --------------------------------------------------------

--
-- Table structure for table `lichsudangnhap`
--

CREATE TABLE `lichsudangnhap` (
  `id` int(11) NOT NULL,
  `taikhoan_id` int(11) NOT NULL,
  `thoi_gian` datetime DEFAULT current_timestamp(),
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `trang_thai` enum('Thành công','Thất bại') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `lichsudangnhap`
--
DELIMITER $$
CREATE TRIGGER `update_last_login` AFTER INSERT ON `lichsudangnhap` FOR EACH ROW BEGIN
    IF NEW.trang_thai = 'Thành công' THEN
        UPDATE taikhoan SET lan_dang_nhap_cuoi = NEW.thoi_gian WHERE id = NEW.taikhoan_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `lich_hoc_kha_dung`
--

CREATE TABLE `lich_hoc_kha_dung` (
  `id` int(11) NOT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `phong_hoc` varchar(20) DEFAULT NULL,
  `thu` enum('Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật') DEFAULT NULL,
  `tiet_bat_dau` int(11) DEFAULT NULL,
  `so_tiet` int(11) DEFAULT NULL,
  `buoi_hoc` enum('Sáng','Chiều','Tối') DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `so_luong_toi_da` int(11) DEFAULT 50,
  `so_luong_da_dang_ky` int(11) DEFAULT 0,
  `loai_tiet` enum('lyThuyet','thucHanh') NOT NULL DEFAULT 'lyThuyet'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lich_hoc_kha_dung`
--

INSERT INTO `lich_hoc_kha_dung` (`id`, `mon_hoc_id`, `phong_hoc`, `thu`, `tiet_bat_dau`, `so_tiet`, `buoi_hoc`, `hoc_ky`, `nam_hoc`, `so_luong_toi_da`, `so_luong_da_dang_ky`, `loai_tiet`) VALUES
(25, 33, 'A105', 'Thứ 5', 4, 3, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(26, 33, 'B205', 'Thứ 6', 7, 2, 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(27, 33, 'C305', 'Chủ nhật', 10, 2, 'Tối', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(28, 34, 'A106', 'Thứ 2', 7, 3, 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(29, 34, 'B206', 'Thứ 4', 1, 3, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(30, 34, 'C306', 'Thứ 6', 10, 3, 'Tối', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(31, 35, 'A107', 'Thứ 3', 1, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(32, 35, 'B207', 'Thứ 5', 7, 2, 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(33, 35, 'C307', 'Thứ 7', 10, 2, 'Tối', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(34, 36, 'A108', 'Thứ 2', 4, 3, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(35, 36, 'B208', 'Thứ 4', 7, 3, 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(36, 36, 'C308', 'Thứ 6', 1, 3, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(37, 37, 'A109', 'Thứ 3', 7, 2, 'Chiều', 'Kỳ 2', '2024-2025', 50, 1, 'lyThuyet'),
(38, 37, 'B209', 'Thứ 5', 1, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(39, 37, 'C309', 'Chủ nhật', 10, 2, 'Tối', 'Kỳ 2', '2024-2025', 50, 1, 'lyThuyet'),
(40, 38, 'A110', 'Thứ 2', 1, 3, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(41, 38, 'B210', 'Thứ 4', 7, 3, 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(42, 38, 'C310', 'Thứ 6', 10, 3, 'Tối', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(43, 34, 'LT01', 'Thứ 2', 1, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(44, 34, 'LT02', 'Thứ 3', 3, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(45, 34, 'TH01', 'Thứ 4', 7, 2, 'Chiều', 'Kỳ 2', '2024-2025', 30, 0, 'thucHanh'),
(46, 34, 'LT03', 'Thứ 5', 1, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(47, 34, 'TH02', 'Thứ 6', 9, 2, 'Chiều', 'Kỳ 2', '2024-2025', 30, 0, 'thucHanh'),
(48, 37, 'P.A101', 'Thứ 3', 1, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 1, 'lyThuyet'),
(49, 37, 'TH101', 'Thứ 2', 3, 2, 'Sáng', 'Kỳ 2', '2024-2025', 30, 1, 'thucHanh'),
(50, 37, 'TH102', 'Thứ 4', 7, 2, 'Chiều', 'Kỳ 2', '2024-2025', 30, 1, 'thucHanh'),
(51, 37, 'TH103', 'Thứ 6', 1, 2, 'Sáng', 'Kỳ 2', '2024-2025', 30, 0, 'thucHanh'),
(52, 37, 'TH104', 'Thứ 7', 7, 2, 'Chiều', 'Kỳ 2', '2024-2025', 30, 1, 'thucHanh'),
(53, 37, 'LT101', 'Thứ 2', 1, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 1, 'lyThuyet'),
(54, 37, 'LT102', 'Thứ 4', 3, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(55, 37, 'TH101', 'Thứ 2', 3, 2, 'Sáng', 'Kỳ 2', '2024-2025', 30, 0, 'thucHanh'),
(56, 37, 'TH102', 'Thứ 2', 7, 2, 'Chiều', 'Kỳ 2', '2024-2025', 30, 1, 'thucHanh'),
(57, 37, 'TH103', 'Thứ 3', 3, 2, 'Sáng', 'Kỳ 2', '2024-2025', 30, 0, 'thucHanh'),
(58, 37, 'TH104', 'Thứ 5', 3, 2, 'Sáng', 'Kỳ 2', '2024-2025', 30, 1, 'thucHanh'),
(59, 37, 'TH105', 'Thứ 5', 7, 2, 'Chiều', 'Kỳ 2', '2024-2025', 30, 1, 'thucHanh'),
(60, 37, 'TH106', 'Thứ 6', 3, 2, 'Sáng', 'Kỳ 2', '2024-2025', 30, 1, 'thucHanh'),
(61, 37, 'TH107', 'Thứ 6', 7, 2, 'Chiều', 'Kỳ 2', '2024-2025', 30, 1, 'thucHanh'),
(62, 37, 'TH108', 'Thứ 7', 3, 2, 'Sáng', 'Kỳ 2', '2024-2025', 30, 1, 'thucHanh'),
(63, 37, 'LT101', 'Thứ 2', 1, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(64, 37, 'LT102', 'Thứ 3', 3, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 1, 'lyThuyet'),
(65, 37, 'LT103', 'Thứ 5', 1, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 1, 'lyThuyet'),
(66, 37, 'LT104', 'Thứ 6', 1, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 1, 'lyThuyet'),
(67, 37, 'LT105', 'Thứ 7', 1, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 1, 'lyThuyet'),
(68, 37, 'LT103', 'Thứ 2', 1, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'lyThuyet'),
(69, 37, 'TH105', 'Thứ 3', 7, 2, 'Chiều', 'Kỳ 2', '2024-2025', 50, 0, 'thucHanh'),
(70, 37, 'LT104', 'Thứ 5', 9, 2, 'Chiều', 'Kỳ 2', '2024-2025', 50, 1, 'lyThuyet'),
(71, 37, 'TH106', 'Thứ 6', 1, 2, 'Sáng', 'Kỳ 2', '2024-2025', 50, 0, 'thucHanh');

-- --------------------------------------------------------

--
-- Table structure for table `lop`
--

CREATE TABLE `lop` (
  `id` int(11) NOT NULL,
  `ma_lop` varchar(10) NOT NULL,
  `ten_lop` varchar(50) NOT NULL,
  `nam_nhap_hoc` int(11) DEFAULT NULL,
  `nganh` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lop`
--

INSERT INTO `lop` (`id`, `ma_lop`, `ten_lop`, `nam_nhap_hoc`, `nganh`) VALUES
(3, 'CNTT01', 'Lớp CNTT 01', 2023, 'CNTT'),
(4, 'CNTT02', 'Lớp CNTT 02', 2022, 'CNTT'),
(5, 'QTKD01', 'Lớp QTKD 01', 2023, 'QTKD'),
(6, 'KT01', 'Lớp Kế toán 01', 2023, 'KT'),
(7, 'DLKS01', 'Lớp Du lịch 01', 2022, 'DLKS');

-- --------------------------------------------------------

--
-- Table structure for table `monhoc`
--

CREATE TABLE `monhoc` (
  `id` int(11) NOT NULL,
  `ma_mon` varchar(10) NOT NULL,
  `ten_mon` varchar(100) NOT NULL,
  `so_tin_chi` int(11) NOT NULL,
  `mo_ta` text DEFAULT NULL,
  `ma_nganh` varchar(10) DEFAULT NULL,
  `tong_so_tiet_ly_thuyet` int(11) DEFAULT 0,
  `tong_so_tiet_thuc_hanh` int(11) DEFAULT 0,
  `mon_hoc_tien_quyet` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `monhoc`
--

INSERT INTO `monhoc` (`id`, `ma_mon`, `ten_mon`, `so_tin_chi`, `mo_ta`, `ma_nganh`, `tong_so_tiet_ly_thuyet`, `tong_so_tiet_thuc_hanh`, `mon_hoc_tien_quyet`) VALUES
(33, 'CTDL', 'Cấu trúc dữ liệu', 3, 'Môn học về cấu trúc dữ liệu', 'CNTT', 45, 45, NULL),
(34, 'HDH', 'Hệ điều hành', 4, 'Môn học về hệ điều hành', 'CNTT', 0, 0, NULL),
(35, 'QLCL', 'Quản lý chất lượng', 2, 'Môn học về quản lý chất lượng', 'QTKD', 0, 0, NULL),
(36, 'KTTC', 'Kế toán tài chính', 3, 'Môn học về kế toán tài chính', 'KT', 0, 0, NULL),
(37, 'DLDL', 'Dẫn lịch du lịch', 2, 'Môn học về hướng dẫn du lịch', 'DLKS', 27, 30, NULL),
(38, 'TKCD', 'Thiết kế cơ bản', 3, 'Môn học về thiết kế đồ họa', 'TKDH', 0, 0, NULL),
(39, 'MH001', 'Toán cao cấp', 2, NULL, NULL, 30, 30, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `nganh`
--

CREATE TABLE `nganh` (
  `id` int(11) NOT NULL,
  `ma_nganh` varchar(10) NOT NULL,
  `ten_nganh` varchar(100) NOT NULL,
  `mo_ta` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `nganh`
--

INSERT INTO `nganh` (`id`, `ma_nganh`, `ten_nganh`, `mo_ta`) VALUES
(13, 'CNTT', 'Công nghệ thông tin', 'Ngành Công nghệ thông tin'),
(14, 'QTKD', 'Quản trị kinh doanh', 'Ngành Quản trị kinh doanh'),
(15, 'KT', 'Kế toán', 'Ngành Kế toán'),
(16, 'DLKS', 'Du lịch & Khách sạn', 'Ngành Du lịch và Khách sạn'),
(17, 'TKDH', 'Thiết kế đồ họa', 'Ngành Thiết kế đồ họa');

-- --------------------------------------------------------

--
-- Table structure for table `nghiencuukhoahoc`
--

CREATE TABLE `nghiencuukhoahoc` (
  `id` int(11) NOT NULL,
  `ten_de_tai` varchar(200) NOT NULL,
  `mo_ta` text DEFAULT NULL,
  `thoi_gian_bat_dau` date DEFAULT NULL,
  `thoi_gian_ket_thuc` date DEFAULT NULL,
  `trang_thai` enum('Đang thực hiện','Đã hoàn thành','Đã hủy') DEFAULT NULL,
  `kinh_phi` decimal(10,2) DEFAULT NULL,
  `ket_qua` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `phanconggiangday`
--

CREATE TABLE `phanconggiangday` (
  `id` int(11) NOT NULL,
  `giang_vien_id` int(11) DEFAULT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `ngay_phan_cong` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `phien_lam_viec`
--

CREATE TABLE `phien_lam_viec` (
  `id` int(11) NOT NULL,
  `taikhoan_id` int(11) NOT NULL,
  `session_token` varchar(100) NOT NULL,
  `thoi_gian_bat_dau` datetime DEFAULT current_timestamp(),
  `thoi_gian_het_han` datetime DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `trang_thai` enum('Hoạt động','Đã kết thúc','Hết hạn') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quanlydiem`
--

CREATE TABLE `quanlydiem` (
  `id` int(11) NOT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `diem_chuyen_can` float DEFAULT NULL,
  `diem_giua_ky` float DEFAULT NULL,
  `diem_cuoi_ky` float DEFAULT NULL,
  `diem_tong_ket` float DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quyenhan`
--

CREATE TABLE `quyenhan` (
  `id` int(11) NOT NULL,
  `ten_quyen` varchar(50) NOT NULL,
  `mo_ta` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quyenhan`
--

INSERT INTO `quyenhan` (`id`, `ten_quyen`, `mo_ta`) VALUES
(1, 'ADMIN', 'Quyền quản trị hệ thống'),
(2, 'GIANGVIEN', 'Quyền dành cho giảng viên'),
(3, 'SINHVIEN', 'Quyền dành cho sinh viên');

-- --------------------------------------------------------

--
-- Table structure for table `sinhvien`
--

CREATE TABLE `sinhvien` (
  `id` int(11) NOT NULL,
  `ma_sv` varchar(10) NOT NULL,
  `ho_ten` varchar(100) NOT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `gioi_tinh` enum('Nam','Nữ','Khác') DEFAULT NULL,
  `dia_chi` text DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `so_dien_thoai` varchar(20) DEFAULT NULL,
  `lop_id` int(11) DEFAULT NULL,
  `trang_thai` enum('Đang học','Đã tốt nghiệp','Nghỉ học','Đình chỉ') DEFAULT 'Đang học',
  `dan_toc` varchar(50) DEFAULT NULL,
  `ton_giao` varchar(50) DEFAULT NULL,
  `ma_so_the_bhyt` varchar(20) DEFAULT NULL,
  `truong_thpt` varchar(100) DEFAULT NULL,
  `nam_tot_nghiep_thpt` int(11) DEFAULT NULL,
  `phuong_xa_thpt` varchar(100) DEFAULT NULL,
  `quan_huyen_thpt` varchar(100) DEFAULT NULL,
  `tinh_thanh_thpt` varchar(100) DEFAULT NULL,
  `ho_ten_phu_huynh` varchar(100) DEFAULT NULL,
  `dia_chi_phu_huynh` text DEFAULT NULL,
  `sdt_phu_huynh` varchar(20) DEFAULT NULL,
  `avatar` varchar(1000) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sinhvien`
--

INSERT INTO `sinhvien` (`id`, `ma_sv`, `ho_ten`, `ngay_sinh`, `gioi_tinh`, `dia_chi`, `email`, `so_dien_thoai`, `lop_id`, `trang_thai`, `dan_toc`, `ton_giao`, `ma_so_the_bhyt`, `truong_thpt`, `nam_tot_nghiep_thpt`, `phuong_xa_thpt`, `quan_huyen_thpt`, `tinh_thanh_thpt`, `ho_ten_phu_huynh`, `dia_chi_phu_huynh`, `sdt_phu_huynh`, `avatar`) VALUES
(8, 'SV001', 'Nguyễn Thị F', '2002-05-15', 'Nữ', '123 Đường ABC, Quận 1, TP.HCM', 'sv006@example.com', '0123456789', 3, 'Đang học', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1742104536424-900948312-BIRD.jpg'),
(9, 'sv002', 'Nguyễn Thị F', '2002-05-15', 'Nam', '123 Đường ABC, Quận 1, TP.HCM', 'sv006@example.com', '0123456789', 4, 'Đang học', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 'SV003', 'Phước Mãi', NULL, 'Nam', '123 Đường ABC, Quận 1, TP.HCM', 'phuocmai@example.com', '0123456789', 5, 'Đang học', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sinhvien_lichhoc`
--

CREATE TABLE `sinhvien_lichhoc` (
  `id` int(11) NOT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `lich_hoc_id` int(11) DEFAULT NULL,
  `ngay_dang_ky` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `taikhoan`
--

CREATE TABLE `taikhoan` (
  `id` int(11) NOT NULL,
  `ten_dang_nhap` varchar(50) NOT NULL,
  `mat_khau_hash` varchar(256) NOT NULL,
  `email` varchar(100) NOT NULL,
  `quyen_han_id` int(11) NOT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `giang_vien_id` int(11) DEFAULT NULL,
  `ngay_tao` datetime DEFAULT current_timestamp(),
  `lan_dang_nhap_cuoi` datetime DEFAULT NULL,
  `trang_thai` enum('Hoạt động','Khóa','Chờ xác nhận') DEFAULT 'Hoạt động',
  `token_reset_password` varchar(100) DEFAULT NULL,
  `token_expiry` datetime DEFAULT NULL
) ;

--
-- Dumping data for table `taikhoan`
--

INSERT INTO `taikhoan` (`id`, `ten_dang_nhap`, `mat_khau_hash`, `email`, `quyen_han_id`, `sinh_vien_id`, `giang_vien_id`, `ngay_tao`, `lan_dang_nhap_cuoi`, `trang_thai`, `token_reset_password`, `token_expiry`) VALUES
(8, 'sv001', '71170fa4a7a78ceade8683744edcd2ae9358e8a35f1b8e5f0b4b6df8663e6ad6b77754c2ee3b917d5e109d13f809b239f2b0dcc17e11da23df4e0dd6196b367f.e05a6cd529d35ff5b779fe47198fd574', 'sv006@example.com', 3, 8, NULL, '2025-03-16 05:54:29', NULL, 'Hoạt động', NULL, NULL),
(10, 'gv003', '798317b9775870cfde140fe06a1d4ea231e0518ea372cbae49b1f11cb37636c430f0bba8457e635c8d78291d8bf8ded7492e039587d17b151b0be19908022743.158f3c7efb42d9f777a7c75e71c5a3f8', 'gv003@example.com', 2, NULL, 4, '2025-03-16 06:36:49', NULL, 'Hoạt động', NULL, NULL),
(11, 'phuocmai', '2bd715790994e484021d52fff37dcd5b79b5d4571493dbd4e5bea566de63e32b9d75df9925cdbfc66bfd4d2558b28c5de5e1d3dc942783acb268aba0320a2e39.d97c12f6b9deeb60f1f8c3e01843cf15', 'phuocmai@example.com', 3, 12, NULL, '2025-03-16 06:39:58', NULL, 'Hoạt động', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tailieugiangday`
--

CREATE TABLE `tailieugiangday` (
  `id` int(11) NOT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
  `ten_tai_lieu` varchar(200) NOT NULL,
  `mo_ta` text DEFAULT NULL,
  `duong_dan` varchar(255) DEFAULT NULL,
  `loai_tai_lieu` varchar(50) DEFAULT NULL,
  `ngay_tao` datetime DEFAULT current_timestamp(),
  `ngay_cap_nhat` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thanhtoanhocphi`
--

CREATE TABLE `thanhtoanhocphi` (
  `id` int(11) NOT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `so_tien` decimal(10,2) DEFAULT NULL,
  `ngay_thanh_toan` datetime DEFAULT NULL,
  `phuong_thuc_thanh_toan` varchar(50) DEFAULT NULL,
  `trang_thai` enum('Đã thanh toán','Chưa thanh toán','Thanh toán một phần') DEFAULT NULL,
  `ghi_chu` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `thanhtoanhocphi`
--

INSERT INTO `thanhtoanhocphi` (`id`, `sinh_vien_id`, `hoc_ky`, `nam_hoc`, `so_tien`, `ngay_thanh_toan`, `phuong_thuc_thanh_toan`, `trang_thai`, `ghi_chu`) VALUES
(5, 8, 'Kỳ 2', '2024-2025', 7000000.00, '2025-03-16 07:53:36', 'Online', 'Đã thanh toán', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `thanhviennghiencuu`
--

CREATE TABLE `thanhviennghiencuu` (
  `id` int(11) NOT NULL,
  `nghien_cuu_id` int(11) DEFAULT NULL,
  `sinh_vien_id` int(11) DEFAULT NULL,
  `giang_vien_id` int(11) DEFAULT NULL,
  `vai_tro` varchar(50) DEFAULT NULL,
  `ngay_tham_gia` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thoigiandangky`
--

CREATE TABLE `thoigiandangky` (
  `id` int(11) NOT NULL,
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL,
  `thoi_gian_bat_dau` timestamp NOT NULL DEFAULT current_timestamp(),
  `thoi_gian_ket_thuc` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `trang_thai` varchar(20) DEFAULT 'Hoạt động',
  `hocky_namhoc_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `thoigiandangky`
--

INSERT INTO `thoigiandangky` (`id`, `hoc_ky`, `nam_hoc`, `thoi_gian_bat_dau`, `thoi_gian_ket_thuc`, `trang_thai`, `hocky_namhoc_id`) VALUES
(1, 'Kỳ 2', '2024-2025', '2025-02-28 17:00:00', '2025-03-31 16:59:59', 'Hoạt động', 3);

-- --------------------------------------------------------

--
-- Table structure for table `thongbao`
--

CREATE TABLE `thongbao` (
  `id` int(11) NOT NULL,
  `tieu_de` varchar(200) NOT NULL,
  `noi_dung` text DEFAULT NULL,
  `ngay_tao` datetime DEFAULT current_timestamp(),
  `nguoi_tao` varchar(100) DEFAULT NULL,
  `doi_tuong` enum('Tất cả','Sinh viên','Giảng viên') DEFAULT NULL,
  `trang_thai` enum('Đã đăng','Nháp','Đã gỡ') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thongbaogiangvien`
--

CREATE TABLE `thongbaogiangvien` (
  `id` int(11) NOT NULL,
  `giang_vien_id` int(11) DEFAULT NULL,
  `tieu_de` varchar(200) NOT NULL,
  `noi_dung` text DEFAULT NULL,
  `ngay_tao` datetime DEFAULT current_timestamp(),
  `doi_tuong` varchar(100) DEFAULT NULL,
  `trang_thai` enum('Đã đăng','Nháp','Đã gỡ') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thongbao_taikhoan`
--

CREATE TABLE `thongbao_taikhoan` (
  `id` int(11) NOT NULL,
  `taikhoan_id` int(11) NOT NULL,
  `tieu_de` varchar(200) NOT NULL,
  `noi_dung` text DEFAULT NULL,
  `ngay_tao` datetime DEFAULT current_timestamp(),
  `da_doc` tinyint(1) DEFAULT 0,
  `loai_thong_bao` enum('Hệ thống','Bảo mật','Thông tin') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_taikhoan_giangvien`
-- (See below for the actual view)
--
CREATE TABLE `view_taikhoan_giangvien` (
`taikhoan_id` int(11)
,`ten_dang_nhap` varchar(50)
,`email` varchar(100)
,`giang_vien_id` int(11)
,`ma_gv` varchar(10)
,`ho_ten` varchar(100)
,`chuyen_mon` varchar(100)
,`hoc_vi` varchar(50)
,`trang_thai` enum('Hoạt động','Khóa','Chờ xác nhận')
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_taikhoan_sinhvien`
-- (See below for the actual view)
--
CREATE TABLE `view_taikhoan_sinhvien` (
`taikhoan_id` int(11)
,`ten_dang_nhap` varchar(50)
,`email` varchar(100)
,`sinh_vien_id` int(11)
,`ma_sv` varchar(10)
,`ho_ten` varchar(100)
,`ma_lop` varchar(10)
,`ten_lop` varchar(50)
,`trang_thai` enum('Hoạt động','Khóa','Chờ xác nhận')
);

-- --------------------------------------------------------

--
-- Structure for view `view_taikhoan_giangvien`
--
DROP TABLE IF EXISTS `view_taikhoan_giangvien`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_taikhoan_giangvien`  AS SELECT `t`.`id` AS `taikhoan_id`, `t`.`ten_dang_nhap` AS `ten_dang_nhap`, `t`.`email` AS `email`, `g`.`id` AS `giang_vien_id`, `g`.`ma_gv` AS `ma_gv`, `g`.`ho_ten` AS `ho_ten`, `g`.`chuyen_mon` AS `chuyen_mon`, `g`.`hoc_vi` AS `hoc_vi`, `t`.`trang_thai` AS `trang_thai` FROM (`taikhoan` `t` join `giangvien` `g` on(`t`.`giang_vien_id` = `g`.`id`)) WHERE `t`.`quyen_han_id` = (select `quyenhan`.`id` from `quyenhan` where `quyenhan`.`ten_quyen` = 'GIANGVIEN') ;

-- --------------------------------------------------------

--
-- Structure for view `view_taikhoan_sinhvien`
--
DROP TABLE IF EXISTS `view_taikhoan_sinhvien`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_taikhoan_sinhvien`  AS SELECT `t`.`id` AS `taikhoan_id`, `t`.`ten_dang_nhap` AS `ten_dang_nhap`, `t`.`email` AS `email`, `s`.`id` AS `sinh_vien_id`, `s`.`ma_sv` AS `ma_sv`, `s`.`ho_ten` AS `ho_ten`, `l`.`ma_lop` AS `ma_lop`, `l`.`ten_lop` AS `ten_lop`, `t`.`trang_thai` AS `trang_thai` FROM ((`taikhoan` `t` join `sinhvien` `s` on(`t`.`sinh_vien_id` = `s`.`id`)) join `lop` `l` on(`s`.`lop_id` = `l`.`id`)) WHERE `t`.`quyen_han_id` = (select `quyenhan`.`id` from `quyenhan` where `quyenhan`.`ten_quyen` = 'SINHVIEN') ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cauhinh_taikhoan`
--
ALTER TABLE `cauhinh_taikhoan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `taikhoan_id` (`taikhoan_id`);

--
-- Indexes for table `dangkyhocphan`
--
ALTER TABLE `dangkyhocphan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `mon_hoc_id` (`mon_hoc_id`);

--
-- Indexes for table `dethi`
--
ALTER TABLE `dethi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mon_hoc_id` (`mon_hoc_id`),
  ADD KEY `dethi_giangvien_ibfk_2` (`giang_vien`);

--
-- Indexes for table `diemdanh`
--
ALTER TABLE `diemdanh`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `mon_hoc_id` (`mon_hoc_id`);

--
-- Indexes for table `giangvien`
--
ALTER TABLE `giangvien`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ma_gv` (`ma_gv`);

--
-- Indexes for table `hocky_namhoc`
--
ALTER TABLE `hocky_namhoc`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ketquahoctap`
--
ALTER TABLE `ketquahoctap`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`);

--
-- Indexes for table `khoaluandoan`
--
ALTER TABLE `khoaluandoan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `giang_vien_huong_dan_id` (`giang_vien_huong_dan_id`);

--
-- Indexes for table `lichgiangday`
--
ALTER TABLE `lichgiangday`
  ADD PRIMARY KEY (`id`),
  ADD KEY `phan_cong_id` (`phan_cong_id`);

--
-- Indexes for table `lichhoc`
--
ALTER TABLE `lichhoc`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mon_hoc_id` (`mon_hoc_id`),
  ADD KEY `lich_hoc_kha_dung_id` (`lich_hoc_kha_dung_id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`);

--
-- Indexes for table `lichsudangky`
--
ALTER TABLE `lichsudangky`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `mon_hoc_id` (`mon_hoc_id`);

--
-- Indexes for table `lichsudangnhap`
--
ALTER TABLE `lichsudangnhap`
  ADD PRIMARY KEY (`id`),
  ADD KEY `taikhoan_id` (`taikhoan_id`);

--
-- Indexes for table `lich_hoc_kha_dung`
--
ALTER TABLE `lich_hoc_kha_dung`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mon_hoc_id` (`mon_hoc_id`);

--
-- Indexes for table `lop`
--
ALTER TABLE `lop`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ma_lop` (`ma_lop`),
  ADD KEY `lop_ibfk_3` (`nganh`);

--
-- Indexes for table `monhoc`
--
ALTER TABLE `monhoc`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ma_mon` (`ma_mon`),
  ADD KEY `ma_nganh` (`ma_nganh`),
  ADD KEY `mon_hoc_tien_quyet` (`mon_hoc_tien_quyet`);

--
-- Indexes for table `nganh`
--
ALTER TABLE `nganh`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ma_nganh` (`ma_nganh`);

--
-- Indexes for table `nghiencuukhoahoc`
--
ALTER TABLE `nghiencuukhoahoc`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `phanconggiangday`
--
ALTER TABLE `phanconggiangday`
  ADD PRIMARY KEY (`id`),
  ADD KEY `giang_vien_id` (`giang_vien_id`),
  ADD KEY `mon_hoc_id` (`mon_hoc_id`);

--
-- Indexes for table `phien_lam_viec`
--
ALTER TABLE `phien_lam_viec`
  ADD PRIMARY KEY (`id`),
  ADD KEY `taikhoan_id` (`taikhoan_id`);

--
-- Indexes for table `quanlydiem`
--
ALTER TABLE `quanlydiem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `mon_hoc_id` (`mon_hoc_id`);

--
-- Indexes for table `quyenhan`
--
ALTER TABLE `quyenhan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sinhvien`
--
ALTER TABLE `sinhvien`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ma_sv` (`ma_sv`),
  ADD KEY `lop_id` (`lop_id`);

--
-- Indexes for table `sinhvien_lichhoc`
--
ALTER TABLE `sinhvien_lichhoc`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `lich_hoc_id` (`lich_hoc_id`);

--
-- Indexes for table `taikhoan`
--
ALTER TABLE `taikhoan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ten_dang_nhap` (`ten_dang_nhap`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `quyen_han_id` (`quyen_han_id`),
  ADD KEY `giang_vien_id` (`giang_vien_id`);

--
-- Indexes for table `tailieugiangday`
--
ALTER TABLE `tailieugiangday`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mon_hoc_id` (`mon_hoc_id`);

--
-- Indexes for table `thanhtoanhocphi`
--
ALTER TABLE `thanhtoanhocphi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`);

--
-- Indexes for table `thanhviennghiencuu`
--
ALTER TABLE `thanhviennghiencuu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nghien_cuu_id` (`nghien_cuu_id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `giang_vien_id` (`giang_vien_id`);

--
-- Indexes for table `thoigiandangky`
--
ALTER TABLE `thoigiandangky`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hocky_namhoc_id` (`hocky_namhoc_id`);

--
-- Indexes for table `thongbao`
--
ALTER TABLE `thongbao`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thongbaogiangvien`
--
ALTER TABLE `thongbaogiangvien`
  ADD PRIMARY KEY (`id`),
  ADD KEY `giang_vien_id` (`giang_vien_id`);

--
-- Indexes for table `thongbao_taikhoan`
--
ALTER TABLE `thongbao_taikhoan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `taikhoan_id` (`taikhoan_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cauhinh_taikhoan`
--
ALTER TABLE `cauhinh_taikhoan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dangkyhocphan`
--
ALTER TABLE `dangkyhocphan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `dethi`
--
ALTER TABLE `dethi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `diemdanh`
--
ALTER TABLE `diemdanh`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `giangvien`
--
ALTER TABLE `giangvien`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `hocky_namhoc`
--
ALTER TABLE `hocky_namhoc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ketquahoctap`
--
ALTER TABLE `ketquahoctap`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `khoaluandoan`
--
ALTER TABLE `khoaluandoan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lichgiangday`
--
ALTER TABLE `lichgiangday`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lichhoc`
--
ALTER TABLE `lichhoc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `lichsudangky`
--
ALTER TABLE `lichsudangky`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `lichsudangnhap`
--
ALTER TABLE `lichsudangnhap`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lich_hoc_kha_dung`
--
ALTER TABLE `lich_hoc_kha_dung`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT for table `lop`
--
ALTER TABLE `lop`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `monhoc`
--
ALTER TABLE `monhoc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `nganh`
--
ALTER TABLE `nganh`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `nghiencuukhoahoc`
--
ALTER TABLE `nghiencuukhoahoc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `phanconggiangday`
--
ALTER TABLE `phanconggiangday`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `phien_lam_viec`
--
ALTER TABLE `phien_lam_viec`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quanlydiem`
--
ALTER TABLE `quanlydiem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `quyenhan`
--
ALTER TABLE `quyenhan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sinhvien`
--
ALTER TABLE `sinhvien`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `sinhvien_lichhoc`
--
ALTER TABLE `sinhvien_lichhoc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `taikhoan`
--
ALTER TABLE `taikhoan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tailieugiangday`
--
ALTER TABLE `tailieugiangday`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thanhtoanhocphi`
--
ALTER TABLE `thanhtoanhocphi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `thanhviennghiencuu`
--
ALTER TABLE `thanhviennghiencuu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thoigiandangky`
--
ALTER TABLE `thoigiandangky`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `thongbao`
--
ALTER TABLE `thongbao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thongbaogiangvien`
--
ALTER TABLE `thongbaogiangvien`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thongbao_taikhoan`
--
ALTER TABLE `thongbao_taikhoan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cauhinh_taikhoan`
--
ALTER TABLE `cauhinh_taikhoan`
  ADD CONSTRAINT `cauhinh_taikhoan_ibfk_1` FOREIGN KEY (`taikhoan_id`) REFERENCES `taikhoan` (`id`);

--
-- Constraints for table `dangkyhocphan`
--
ALTER TABLE `dangkyhocphan`
  ADD CONSTRAINT `dangkyhocphan_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`),
  ADD CONSTRAINT `dangkyhocphan_ibfk_2` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`);

--
-- Constraints for table `dethi`
--
ALTER TABLE `dethi`
  ADD CONSTRAINT `dethi_giangvien_ibfk_2` FOREIGN KEY (`giang_vien`) REFERENCES `giangvien` (`ma_gv`),
  ADD CONSTRAINT `dethi_ibfk_1` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`);

--
-- Constraints for table `diemdanh`
--
ALTER TABLE `diemdanh`
  ADD CONSTRAINT `diemdanh_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`),
  ADD CONSTRAINT `diemdanh_ibfk_2` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`);

--
-- Constraints for table `ketquahoctap`
--
ALTER TABLE `ketquahoctap`
  ADD CONSTRAINT `ketquahoctap_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`);

--
-- Constraints for table `khoaluandoan`
--
ALTER TABLE `khoaluandoan`
  ADD CONSTRAINT `khoaluandoan_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`),
  ADD CONSTRAINT `khoaluandoan_ibfk_2` FOREIGN KEY (`giang_vien_huong_dan_id`) REFERENCES `giangvien` (`id`);

--
-- Constraints for table `lichgiangday`
--
ALTER TABLE `lichgiangday`
  ADD CONSTRAINT `lichgiangday_ibfk_1` FOREIGN KEY (`phan_cong_id`) REFERENCES `phanconggiangday` (`id`);

--
-- Constraints for table `lichhoc`
--
ALTER TABLE `lichhoc`
  ADD CONSTRAINT `lichhoc_ibfk_1` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`),
  ADD CONSTRAINT `lichhoc_ibfk_2` FOREIGN KEY (`lich_hoc_kha_dung_id`) REFERENCES `lich_hoc_kha_dung` (`id`),
  ADD CONSTRAINT `lichhoc_ibfk_3` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`);

--
-- Constraints for table `lichsudangky`
--
ALTER TABLE `lichsudangky`
  ADD CONSTRAINT `lichsudangky_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`),
  ADD CONSTRAINT `lichsudangky_ibfk_2` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`);

--
-- Constraints for table `lichsudangnhap`
--
ALTER TABLE `lichsudangnhap`
  ADD CONSTRAINT `lichsudangnhap_ibfk_1` FOREIGN KEY (`taikhoan_id`) REFERENCES `taikhoan` (`id`);

--
-- Constraints for table `lich_hoc_kha_dung`
--
ALTER TABLE `lich_hoc_kha_dung`
  ADD CONSTRAINT `lichhockhadung_ibfk_1` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`);

--
-- Constraints for table `lop`
--
ALTER TABLE `lop`
  ADD CONSTRAINT `lop_ibfk_3` FOREIGN KEY (`nganh`) REFERENCES `nganh` (`ma_nganh`);

--
-- Constraints for table `monhoc`
--
ALTER TABLE `monhoc`
  ADD CONSTRAINT `ma_nganh` FOREIGN KEY (`ma_nganh`) REFERENCES `nganh` (`ma_nganh`),
  ADD CONSTRAINT `monhoc_ibfk_1` FOREIGN KEY (`mon_hoc_tien_quyet`) REFERENCES `monhoc` (`id`);

--
-- Constraints for table `phanconggiangday`
--
ALTER TABLE `phanconggiangday`
  ADD CONSTRAINT `phanconggiangday_ibfk_1` FOREIGN KEY (`giang_vien_id`) REFERENCES `giangvien` (`id`),
  ADD CONSTRAINT `phanconggiangday_ibfk_2` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`);

--
-- Constraints for table `phien_lam_viec`
--
ALTER TABLE `phien_lam_viec`
  ADD CONSTRAINT `phien_lam_viec_ibfk_1` FOREIGN KEY (`taikhoan_id`) REFERENCES `taikhoan` (`id`);

--
-- Constraints for table `quanlydiem`
--
ALTER TABLE `quanlydiem`
  ADD CONSTRAINT `quanlydiem_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`),
  ADD CONSTRAINT `quanlydiem_ibfk_2` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`);

--
-- Constraints for table `sinhvien`
--
ALTER TABLE `sinhvien`
  ADD CONSTRAINT `sinhvien_ibfk_1` FOREIGN KEY (`lop_id`) REFERENCES `lop` (`id`);

--
-- Constraints for table `sinhvien_lichhoc`
--
ALTER TABLE `sinhvien_lichhoc`
  ADD CONSTRAINT `sinhvien_lichhoc_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`),
  ADD CONSTRAINT `sinhvien_lichhoc_ibfk_2` FOREIGN KEY (`lich_hoc_id`) REFERENCES `lichhoc` (`id`);

--
-- Constraints for table `taikhoan`
--
ALTER TABLE `taikhoan`
  ADD CONSTRAINT `taikhoan_ibfk_1` FOREIGN KEY (`quyen_han_id`) REFERENCES `quyenhan` (`id`),
  ADD CONSTRAINT `taikhoan_ibfk_2` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`),
  ADD CONSTRAINT `taikhoan_ibfk_3` FOREIGN KEY (`giang_vien_id`) REFERENCES `giangvien` (`id`);

--
-- Constraints for table `tailieugiangday`
--
ALTER TABLE `tailieugiangday`
  ADD CONSTRAINT `tailieugiangday_ibfk_1` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`);

--
-- Constraints for table `thanhtoanhocphi`
--
ALTER TABLE `thanhtoanhocphi`
  ADD CONSTRAINT `thanhtoanhocphi_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`);

--
-- Constraints for table `thanhviennghiencuu`
--
ALTER TABLE `thanhviennghiencuu`
  ADD CONSTRAINT `thanhviennghiencuu_ibfk_1` FOREIGN KEY (`nghien_cuu_id`) REFERENCES `nghiencuukhoahoc` (`id`),
  ADD CONSTRAINT `thanhviennghiencuu_ibfk_2` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinhvien` (`id`),
  ADD CONSTRAINT `thanhviennghiencuu_ibfk_3` FOREIGN KEY (`giang_vien_id`) REFERENCES `giangvien` (`id`);

--
-- Constraints for table `thoigiandangky`
--
ALTER TABLE `thoigiandangky`
  ADD CONSTRAINT `thoigiandangky_ibfk_1` FOREIGN KEY (`hocky_namhoc_id`) REFERENCES `hocky_namhoc` (`id`);

--
-- Constraints for table `thongbaogiangvien`
--
ALTER TABLE `thongbaogiangvien`
  ADD CONSTRAINT `thongbaogiangvien_ibfk_1` FOREIGN KEY (`giang_vien_id`) REFERENCES `giangvien` (`id`);

--
-- Constraints for table `thongbao_taikhoan`
--
ALTER TABLE `thongbao_taikhoan`
  ADD CONSTRAINT `thongbao_taikhoan_ibfk_1` FOREIGN KEY (`taikhoan_id`) REFERENCES `taikhoan` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
