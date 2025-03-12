-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 12, 2025 at 03:15 AM
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

-- --------------------------------------------------------

--
-- Table structure for table `dethi`
--

CREATE TABLE `dethi` (
  `id` int(11) NOT NULL,
  `mon_hoc_id` int(11) DEFAULT NULL,
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
  `hoc_ky` varchar(20) DEFAULT NULL,
  `nam_hoc` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
-- Table structure for table `lop`
--

CREATE TABLE `lop` (
  `id` int(11) NOT NULL,
  `ma_lop` varchar(10) NOT NULL,
  `ten_lop` varchar(50) NOT NULL,
  `nganh_id` int(11) DEFAULT NULL,
  `nam_nhap_hoc` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `monhoc`
--

CREATE TABLE `monhoc` (
  `id` int(11) NOT NULL,
  `ma_mon` varchar(10) NOT NULL,
  `ten_mon` varchar(100) NOT NULL,
  `so_tin_chi` int(11) NOT NULL,
  `mo_ta` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `trang_thai` enum('Đang học','Đã tốt nghiệp','Nghỉ học','Đình chỉ') DEFAULT 'Đang học'
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
  ADD KEY `mon_hoc_id` (`mon_hoc_id`);

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
  ADD KEY `mon_hoc_id` (`mon_hoc_id`);

--
-- Indexes for table `lichsudangnhap`
--
ALTER TABLE `lichsudangnhap`
  ADD PRIMARY KEY (`id`),
  ADD KEY `taikhoan_id` (`taikhoan_id`);

--
-- Indexes for table `lop`
--
ALTER TABLE `lop`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ma_lop` (`ma_lop`),
  ADD KEY `nganh_id` (`nganh_id`);

--
-- Indexes for table `monhoc`
--
ALTER TABLE `monhoc`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ma_mon` (`ma_mon`);

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
-- Indexes for table `taikhoan`
--
ALTER TABLE `taikhoan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ten_dang_nhap` (`ten_dang_nhap`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `quyen_han_id` (`quyen_han_id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dethi`
--
ALTER TABLE `dethi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `diemdanh`
--
ALTER TABLE `diemdanh`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `giangvien`
--
ALTER TABLE `giangvien`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ketquahoctap`
--
ALTER TABLE `ketquahoctap`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lichsudangnhap`
--
ALTER TABLE `lichsudangnhap`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lop`
--
ALTER TABLE `lop`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `monhoc`
--
ALTER TABLE `monhoc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `nganh`
--
ALTER TABLE `nganh`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quyenhan`
--
ALTER TABLE `quyenhan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sinhvien`
--
ALTER TABLE `sinhvien`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thanhviennghiencuu`
--
ALTER TABLE `thanhviennghiencuu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  ADD CONSTRAINT `lichhoc_ibfk_1` FOREIGN KEY (`mon_hoc_id`) REFERENCES `monhoc` (`id`);

--
-- Constraints for table `lichsudangnhap`
--
ALTER TABLE `lichsudangnhap`
  ADD CONSTRAINT `lichsudangnhap_ibfk_1` FOREIGN KEY (`taikhoan_id`) REFERENCES `taikhoan` (`id`);

--
-- Constraints for table `lop`
--
ALTER TABLE `lop`
  ADD CONSTRAINT `lop_ibfk_1` FOREIGN KEY (`nganh_id`) REFERENCES `nganh` (`id`);

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
